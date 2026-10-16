import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenancyService } from '../tenancy/tenancy.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import {
  ItemStatus,
  ClaimStatus,
  NotificationType,
} from '../../domain/enums';
import {
  canTransitionItem,
} from './lifecycle.state-machine';
import { AdvanceStatusDto } from './dto/advance-status.dto';
import { RedeemTokenDto } from './dto/redeem-token.dto';
import { HandoverDto } from './dto/handover.dto';
import { PostReturnFeedbackDto } from './dto/post-return-feedback.dto';

@Injectable()
export class LifecycleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancyService: TenancyService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Advances item status via the WF-1 state machine (FR-22).
   */
  async advanceStatus(
    caseId: string,
    dto: AdvanceStatusDto,
    adminUser: AuthUser,
  ) {
    const item = await this.prisma.item.findUnique({
      where: { caseId },
    });

    if (!item) {
      throw new NotFoundException(`Item with case ID '${caseId}' not found`);
    }

    this.tenancyService.assertCampusAccess(adminUser.campusId, item.campusId);

    // WF-1: Check transition validity
    const check = canTransitionItem(item.status, dto.status);
    if (!check.allowed) {
      throw new BadRequestException(
        `Invalid status transition from '${item.status}' to '${dto.status}'`,
      );
    }

    // Specific domain guards
    if (dto.status === ItemStatus.READY_FOR_COLLECTION) {
      const approvedClaim = await this.prisma.claim.findFirst({
        where: { itemId: item.id, status: ClaimStatus.APPROVED },
      });
      if (!approvedClaim) {
        throw new BadRequestException(
          'Cannot transition to READY_FOR_COLLECTION without an approved claim',
        );
      }
    } else if (dto.status === ItemStatus.RETURNED) {
      const claim = await this.prisma.claim.findFirst({
        where: { itemId: item.id, status: ClaimStatus.APPROVED },
      });
      if (!claim) {
        throw new BadRequestException('Cannot mark RETURNED without an approved claim');
      }
      const bothSides = claim.handoverAt && claim.receiptConfirmedAt;
      const override = Boolean(claim.handoverOverrideBy);
      if (!bothSides && !override) {
        throw new BadRequestException(
          'Cannot mark RETURNED without complete two-way handover or staff override (WF-4)',
        );
      }
    } else if (dto.status === ItemStatus.ARCHIVED) {
      if (item.status !== ItemStatus.RETURNED && item.status !== ItemStatus.LOST_REPORTED) {
        throw new BadRequestException(
          'Only RETURNED cases or closed LOST_REPORTED cases can be ARCHIVED',
        );
      }
    } else if (dto.status === ItemStatus.UNCLAIMED) {
      if (item.status !== ItemStatus.FOUND) {
        throw new BadRequestException(
          'Only FOUND items can be marked UNCLAIMED',
        );
      }
    }

    const updated = await this.prisma.item.update({
      where: { id: item.id },
      data: {
        status: dto.status,
        archivedAt: dto.status === ItemStatus.ARCHIVED ? new Date() : item.archivedAt,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: adminUser.id,
        action: 'ITEM_STATUS_ADVANCE',
        targetType: 'Item',
        targetId: item.id,
        before: { status: item.status },
        after: { status: dto.status },
      },
    });

    return updated;
  }

  /**
   * Marks item READY_FOR_COLLECTION and notifies claimant (FR-23).
   */
  async markReadyForCollection(caseId: string, adminUser: AuthUser) {
    const item = await this.prisma.item.findUnique({
      where: { caseId },
    });

    if (!item) {
      throw new NotFoundException(`Item with case ID '${caseId}' not found`);
    }

    this.tenancyService.assertCampusAccess(adminUser.campusId, item.campusId);

    const approvedClaim = await this.prisma.claim.findFirst({
      where: { itemId: item.id, status: ClaimStatus.APPROVED },
      include: { collectionToken: true },
    });

    if (!approvedClaim) {
      throw new BadRequestException(
        'Cannot mark item ready for collection without an approved claim',
      );
    }

    const updated = await this.prisma.item.update({
      where: { id: item.id },
      data: { status: ItemStatus.READY_FOR_COLLECTION },
    });

    await this.notificationsService.notify({
      userId: approvedClaim.claimantId,
      type: NotificationType.READY_FOR_COLLECTION,
      message: `Item '${item.itemName}' (${item.caseId}) is ready for collection at the campus security desk.`,
      eventKey: `READY_FOR_COLLECTION:${item.id}`,
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: adminUser.id,
        action: 'ITEM_READY_FOR_COLLECTION',
        targetType: 'Item',
        targetId: item.id,
        before: { status: item.status },
        after: { status: ItemStatus.READY_FOR_COLLECTION },
      },
    });

    return { item: updated, claim: approvedClaim };
  }

  /**
   * Staff-side handover recording and optional override (WF-4, FR-24).
   */
  async staffHandover(caseId: string, dto: HandoverDto, adminUser: AuthUser) {
    const item = await this.prisma.item.findUnique({
      where: { caseId },
    });

    if (!item) {
      throw new NotFoundException(`Item with case ID '${caseId}' not found`);
    }

    this.tenancyService.assertCampusAccess(adminUser.campusId, item.campusId);

    if (item.status !== ItemStatus.READY_FOR_COLLECTION) {
      throw new BadRequestException(
        `Item cannot undergo handover in status '${item.status}'`,
      );
    }

    const approvedClaim = await this.prisma.claim.findFirst({
      where: { itemId: item.id, status: ClaimStatus.APPROVED },
    });

    if (!approvedClaim) {
      throw new NotFoundException('No active approved claim found for item');
    }

    if (dto.override && (!dto.overrideReason || !dto.overrideReason.trim())) {
      throw new BadRequestException(
        'Override reason is required when performing staff handover override',
      );
    }

    const handoverAt = new Date();
    const claimUpdateData: any = {
      handoverAt,
    };

    if (dto.override) {
      claimUpdateData.handoverOverrideBy = adminUser.id;
      claimUpdateData.handoverOverrideReason = dto.overrideReason!.trim();
    }

    const updatedClaim = await this.prisma.claim.update({
      where: { id: approvedClaim.id },
      data: claimUpdateData,
    });

    // WF-4 Guard: (handoverAt && receiptConfirmedAt) OR handoverOverrideBy
    const bothSidesPresent = Boolean(
      updatedClaim.handoverAt && updatedClaim.receiptConfirmedAt,
    );
    const overridePresent = Boolean(updatedClaim.handoverOverrideBy);

    let currentItemStatus: ItemStatus = item.status;

    if (bothSidesPresent || overridePresent) {
      const updatedItem = await this.prisma.item.update({
        where: { id: item.id },
        data: { status: ItemStatus.RETURNED },
      });
      currentItemStatus = updatedItem.status;

      // Notify parties
      await this.notificationsService.notify({
        userId: updatedClaim.claimantId,
        type: NotificationType.ITEM_RETURNED,
        message: `Item '${item.itemName}' (${item.caseId}) has been handed over. Please submit your return confirmation feedback.`,
        eventKey: `ITEM_RETURNED:CLAIMANT:${item.id}`,
      });

      if (item.reporterId !== updatedClaim.claimantId) {
        await this.notificationsService.notify({
          userId: item.reporterId,
          type: NotificationType.ITEM_RETURNED,
          message: `The item '${item.itemName}' (${item.caseId}) reported by you has been successfully returned to its owner.`,
          eventKey: `ITEM_RETURNED:REPORTER:${item.id}`,
        });
      }

      await this.prisma.auditLog.create({
        data: {
          actorId: adminUser.id,
          action: overridePresent ? 'HANDOVER_OVERRIDE_RETURNED' : 'TWO_WAY_HANDOVER_RETURNED',
          targetType: 'Item',
          targetId: item.id,
          before: { status: item.status },
          after: { status: ItemStatus.RETURNED },
        },
      });
    } else {
      await this.prisma.auditLog.create({
        data: {
          actorId: adminUser.id,
          action: 'STAFF_HANDOVER_RECORDED',
          targetType: 'Claim',
          targetId: updatedClaim.id,
          after: { handoverAt },
        },
      });
    }

    return {
      claim: updatedClaim,
      itemStatus: currentItemStatus,
      isFullyReturned: currentItemStatus === ItemStatus.RETURNED,
    };
  }

  /**
   * User-side handover receipt confirmation (WF-4, FR-24).
   */
  async confirmReceipt(caseId: string, user: AuthUser) {
    const item = await this.prisma.item.findUnique({
      where: { caseId },
    });

    if (!item) {
      throw new NotFoundException(`Item with case ID '${caseId}' not found`);
    }

    if (item.status !== ItemStatus.READY_FOR_COLLECTION && item.status !== ItemStatus.RETURNED) {
      throw new BadRequestException(
        `Cannot confirm receipt for item in status '${item.status}'`,
      );
    }

    const approvedClaim = await this.prisma.claim.findFirst({
      where: { itemId: item.id, claimantId: user.id, status: ClaimStatus.APPROVED },
    });

    if (!approvedClaim) {
      throw new ForbiddenException(
        'You do not have an approved claim for this item',
      );
    }

    const receiptConfirmedAt = new Date();
    const updatedClaim = await this.prisma.claim.update({
      where: { id: approvedClaim.id },
      data: { receiptConfirmedAt },
    });

    // WF-4 Guard: (handoverAt && receiptConfirmedAt) OR handoverOverrideBy
    const bothSidesPresent = Boolean(
      updatedClaim.handoverAt && updatedClaim.receiptConfirmedAt,
    );
    const overridePresent = Boolean(updatedClaim.handoverOverrideBy);

    let currentItemStatus: ItemStatus = item.status;

    if ((bothSidesPresent || overridePresent) && item.status !== ItemStatus.RETURNED) {
      const updatedItem = await this.prisma.item.update({
        where: { id: item.id },
        data: { status: ItemStatus.RETURNED },
      });
      currentItemStatus = updatedItem.status;

      await this.notificationsService.notify({
        userId: updatedClaim.claimantId,
        type: NotificationType.ITEM_RETURNED,
        message: `Thank you for confirming receipt for '${item.itemName}' (${item.caseId}). Case is now RETURNED.`,
        eventKey: `ITEM_RETURNED:CLAIMANT:${item.id}`,
      });

      if (item.reporterId !== updatedClaim.claimantId) {
        await this.notificationsService.notify({
          userId: item.reporterId,
          type: NotificationType.ITEM_RETURNED,
          message: `Item '${item.itemName}' (${item.caseId}) reported by you has been confirmed returned by the owner.`,
          eventKey: `ITEM_RETURNED:REPORTER:${item.id}`,
        });
      }

      await this.prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: 'TWO_WAY_HANDOVER_RETURNED',
          targetType: 'Item',
          targetId: item.id,
          before: { status: item.status },
          after: { status: ItemStatus.RETURNED },
        },
      });
    } else {
      await this.prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: 'RECEIPT_CONFIRMED_RECORDED',
          targetType: 'Claim',
          targetId: updatedClaim.id,
          after: { receiptConfirmedAt },
        },
      });
    }

    return {
      claim: updatedClaim,
      itemStatus: currentItemStatus,
      isFullyReturned: currentItemStatus === ItemStatus.RETURNED,
    };
  }

  /**
   * Redeem single-use collection token (FR-23, INV-DM-5, INT-7).
   * Also records staff handover.
   */
  async redeemToken(claimId: string, dto: RedeemTokenDto, adminUser: AuthUser) {
    const claim = await this.prisma.claim.findUnique({
      where: { id: claimId },
      include: {
        item: true,
        collectionToken: true,
      },
    });

    if (!claim) {
      throw new NotFoundException(`Claim with ID '${claimId}' not found`);
    }

    this.tenancyService.assertCampusAccess(adminUser.campusId, claim.item.campusId);

    if (!claim.collectionToken) {
      throw new NotFoundException('No collection token found for this claim');
    }

    if (claim.collectionToken.code !== dto.code.trim()) {
      throw new BadRequestException('Invalid collection token code');
    }

    if (claim.collectionToken.expiresAt < new Date()) {
      throw new BadRequestException('Collection token has expired');
    }

    // INV-DM-5 & INT-7: Atomic conditional update
    const updateResult = await this.prisma.collectionToken.updateMany({
      where: {
        id: claim.collectionToken.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    if (updateResult.count === 0) {
      throw new ConflictException('Collection token has already been redeemed');
    }

    // Token redemption marks staff handover
    const handoverAt = new Date();
    const updatedClaim = await this.prisma.claim.update({
      where: { id: claimId },
      data: { handoverAt },
    });

    // Check WF-4
    let currentItemStatus: ItemStatus = claim.item.status;
    if (updatedClaim.receiptConfirmedAt) {
      const updatedItem = await this.prisma.item.update({
        where: { id: claim.item.id },
        data: { status: ItemStatus.RETURNED },
      });
      currentItemStatus = updatedItem.status;

      await this.notificationsService.notify({
        userId: claim.claimantId,
        type: NotificationType.ITEM_RETURNED,
        message: `Token redeemed and receipt confirmed for '${claim.item.itemName}'.`,
        eventKey: `ITEM_RETURNED:CLAIMANT:${claim.item.id}`,
      });
    }

    await this.prisma.auditLog.create({
      data: {
        actorId: adminUser.id,
        action: 'COLLECTION_TOKEN_REDEEMED',
        targetType: 'CollectionToken',
        targetId: claim.collectionToken.id,
        after: { usedAt: new Date() },
      },
    });

    return {
      success: true,
      claimId,
      redeemedAt: new Date(),
      itemStatus: currentItemStatus,
      isFullyReturned: currentItemStatus === ItemStatus.RETURNED,
    };
  }

  /**
   * Post-return confirmation and satisfaction feedback (FR-25).
   */
  async postReturnFeedback(
    claimId: string,
    dto: PostReturnFeedbackDto,
    user: AuthUser,
  ) {
    const claim = await this.prisma.claim.findUnique({
      where: { id: claimId },
      include: { item: true },
    });

    if (!claim) {
      throw new NotFoundException(`Claim with ID '${claimId}' not found`);
    }

    if (claim.claimantId !== user.id) {
      throw new ForbiddenException(
        'You can only submit post-return feedback for your own claim',
      );
    }

    if (claim.item.status !== ItemStatus.RETURNED && !claim.handoverAt) {
      throw new BadRequestException(
        'Feedback can only be submitted for returned items',
      );
    }

    const feedbackPayload = JSON.stringify({
      isCorrectItem: dto.isCorrectItem,
      comments: dto.comments ? dto.comments.trim() : null,
      submittedAt: new Date().toISOString(),
    });

    const updated = await this.prisma.claim.update({
      where: { id: claimId },
      data: {
        postReturnFeedback: feedbackPayload,
      },
    });

    if (!dto.isCorrectItem) {
      // Flag return discrepancy for staff review
      await this.prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: 'FLAG_RETURN_DISCREPANCY',
          targetType: 'Claim',
          targetId: claimId,
          after: { feedback: feedbackPayload },
        },
      });

      // Find campus admin to notify
      const adminUsers = await this.prisma.user.findMany({
        where: {
          campusId: claim.item.campusId,
          role: 'ADMIN',
        },
        take: 5,
      });

      for (const admin of adminUsers) {
        await this.notificationsService.notify({
          userId: admin.id,
          type: NotificationType.ITEM_RETURNED,
          message: `DISCREPANCY FLAGGED: Claimant reported received item was NOT the correct item for '${claim.item.itemName}' (${claim.item.caseId}).`,
          eventKey: `DISCREPANCY_FLAGGED:${claim.id}`,
        });
      }
    } else {
      await this.prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: 'POST_RETURN_FEEDBACK_RECORDED',
          targetType: 'Claim',
          targetId: claimId,
          after: { feedback: feedbackPayload },
        },
      });
    }

    return updated;
  }

  /**
   * Archive a returned or closed case (FR-26).
   */
  async archiveItem(caseId: string, adminUser: AuthUser) {
    const item = await this.prisma.item.findUnique({
      where: { caseId },
    });

    if (!item) {
      throw new NotFoundException(`Item with case ID '${caseId}' not found`);
    }

    this.tenancyService.assertCampusAccess(adminUser.campusId, item.campusId);

    // Only RETURNED or LOST_REPORTED can be archived
    if (item.status !== ItemStatus.RETURNED && item.status !== ItemStatus.LOST_REPORTED) {
      throw new BadRequestException(
        `Cannot archive item in status '${item.status}'. Only RETURNED cases or closed lost reports can be archived.`,
      );
    }

    const updated = await this.prisma.item.update({
      where: { id: item.id },
      data: {
        status: ItemStatus.ARCHIVED,
        archivedAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: adminUser.id,
        action: 'ITEM_ARCHIVED',
        targetType: 'Item',
        targetId: item.id,
        before: { status: item.status },
        after: { status: ItemStatus.ARCHIVED },
      },
    });

    return updated;
  }

  /**
   * Move stale found item to UNCLAIMED (FR-27).
   */
  async markUnclaimed(caseId: string, adminUser: AuthUser) {
    const item = await this.prisma.item.findUnique({
      where: { caseId },
    });

    if (!item) {
      throw new NotFoundException(`Item with case ID '${caseId}' not found`);
    }

    this.tenancyService.assertCampusAccess(adminUser.campusId, item.campusId);

    if (item.status !== ItemStatus.FOUND) {
      throw new BadRequestException(
        `Cannot mark UNCLAIMED for item in status '${item.status}'. Must be in FOUND status.`,
      );
    }

    const updated = await this.prisma.item.update({
      where: { id: item.id },
      data: {
        status: ItemStatus.UNCLAIMED,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: adminUser.id,
        action: 'ITEM_UNCLAIMED',
        targetType: 'Item',
        targetId: item.id,
        before: { status: item.status },
        after: { status: ItemStatus.UNCLAIMED },
      },
    });

    return updated;
  }
}
