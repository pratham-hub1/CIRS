import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { TenancyService } from '../tenancy/tenancy.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RequestInfoDto } from './dto/request-info.dto';
import { RejectClaimDto } from './dto/reject-claim.dto';
import { AddQuestionsDto } from './dto/add-questions.dto';
import { DecideAppealDto } from './dto/decide-appeal.dto';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import {
  AppealStatus,
  ClaimStatus,
  ItemStatus,
  NotificationType,
  QuestionSource,
} from '../../domain/enums';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancyService: TenancyService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * List claims for staff review.
   */
  async getClaims(adminUser: AuthUser, status?: ClaimStatus) {
    return this.prisma.claim.findMany({
      where: {
        item: { campusId: adminUser.campusId },
        ...(status ? { status } : {}),
      },
      include: {
        item: {
          select: {
            caseId: true,
            itemName: true,
            category: true,
            status: true,
            foundLocation: true,
            dateFound: true,
          },
        },
        claimant: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        questions: true,
        documents: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * FR-18, WF-2: Request more information from claimant.
   */
  async requestMoreInfo(
    adminUser: AuthUser,
    claimId: string,
    dto: RequestInfoDto,
  ) {
    const claim = await this.prisma.claim.findUnique({
      where: { id: claimId },
      include: { item: true, claimant: true },
    });

    if (!claim) {
      throw new NotFoundException(`Claim with ID '${claimId}' not found`);
    }

    this.tenancyService.assertCampusAccess(adminUser.campusId, claim.item.campusId);

    // WF-2: Allowed from PENDING -> INFO_REQUESTED
    if (claim.status !== ClaimStatus.PENDING) {
      throw new BadRequestException(
        `Cannot request info for claim in status '${claim.status}'`,
      );
    }

    // Add any extra staff questions
    if (dto.questions && dto.questions.length > 0) {
      await this.prisma.claimQuestion.createMany({
        data: dto.questions.map((q) => ({
          claimId,
          questionText: q.trim(),
          source: QuestionSource.MANUAL,
        })),
      });
    }

    const updated = await this.prisma.claim.update({
      where: { id: claimId },
      data: {
        status: ClaimStatus.INFO_REQUESTED,
        decisionReason: dto.reason.trim(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: adminUser.id,
        action: 'CLAIM_INFO_REQUESTED',
        targetType: 'Claim',
        targetId: claim.id,
        before: { status: claim.status },
        after: { status: updated.status, reason: dto.reason },
      },
    });

    // FR-29: Notify claimant
    await this.notificationsService.notify({
      userId: claim.claimantId,
      type: NotificationType.MORE_INFO_NEEDED,
      message: `Additional information requested for your claim on '${claim.item.itemName}': ${dto.reason}`,
      eventKey: `MORE_INFO_NEEDED:${claim.id}:${Date.now()}`,
    });

    return updated;
  }

  /**
   * FR-18, FR-20, INV-DM-4, WF-2, INT-1: Approve claim, create hold, and issue collection token.
   */
  async approveClaim(adminUser: AuthUser, claimId: string) {
    const claim = await this.prisma.claim.findUnique({
      where: { id: claimId },
      include: { item: true },
    });

    if (!claim) {
      throw new NotFoundException(`Claim with ID '${claimId}' not found`);
    }

    this.tenancyService.assertCampusAccess(adminUser.campusId, claim.item.campusId);

    // WF-2: Only PENDING or INFO_REQUESTED can be APPROVED
    const allowed: ClaimStatus[] = [ClaimStatus.PENDING, ClaimStatus.INFO_REQUESTED];
    if (!allowed.includes(claim.status)) {
      throw new BadRequestException(
        `Cannot approve claim in status '${claim.status}'`,
      );
    }

    // Pre-check for hold (INV-DM-4)
    const existingApproved = await this.prisma.claim.findFirst({
      where: {
        itemId: claim.itemId,
        status: ClaimStatus.APPROVED,
      },
    });

    if (existingApproved) {
      throw new ConflictException(
        'This item already has an approved claim (hold active). Only one claim can be approved.',
      );
    }

    // Generate unique collection token (INV-DM-5, FR-23)
    const tokenCode = this.generateCollectionTokenCode();
    const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // INT-1, INT-7: Atomic transaction for approval + hold + status advance + token issuance
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // 1. Approve claim (Index UNIQUE(itemId) WHERE status = 'APPROVED' enforces hold at DB level)
        const approvedClaim = await tx.claim.update({
          where: { id: claimId },
          data: {
            status: ClaimStatus.APPROVED,
            decidedBy: adminUser.id,
            decidedAt: new Date(),
          },
        });

        // 2. Advance item status FOUND -> READY_FOR_COLLECTION (WF-1, INT-1)
        await tx.item.update({
          where: { id: claim.itemId },
          data: {
            status: ItemStatus.READY_FOR_COLLECTION,
          },
        });

        // 3. Issue single-use collection token (INV-DM-5)
        const token = await tx.collectionToken.create({
          data: {
            claimId,
            code: tokenCode,
            expiresAt: tokenExpiresAt,
          },
        });

        // 4. Record transactional audit log (INT-8)
        await tx.auditLog.create({
          data: {
            actorId: adminUser.id,
            action: 'CLAIM_APPROVED',
            targetType: 'Claim',
            targetId: claimId,
            before: { status: claim.status, itemStatus: claim.item.status },
            after: {
              status: ClaimStatus.APPROVED,
              itemStatus: ItemStatus.READY_FOR_COLLECTION,
              tokenId: token.id,
            },
          },
        });

        return { approvedClaim, token };
      });

      // Post-commit: Notify claimant with collection code and instructions (FR-23, FR-29)
      await this.notificationsService.notify({
        userId: claim.claimantId,
        type: NotificationType.CLAIM_APPROVED,
        message: `Your claim for '${claim.item.itemName}' (${claim.item.caseId}) has been APPROVED. Pickup code: ${tokenCode}. Please visit the security desk for collection.`,
        eventKey: `CLAIM_APPROVED:${claim.id}`,
      });

      await this.notificationsService.notify({
        userId: claim.claimantId,
        type: NotificationType.READY_FOR_COLLECTION,
        message: `Item '${claim.item.itemName}' is READY FOR COLLECTION at the designated storage location. Show pickup code ${tokenCode}.`,
        eventKey: `READY_FOR_COLLECTION:${claim.id}`,
      });

      return {
        claimId: result.approvedClaim.id,
        status: result.approvedClaim.status,
        holdCreated: true,
        collectionToken: {
          issued: true,
          code: result.token.code,
          expiresAt: result.token.expiresAt,
        },
      };
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Concurrency collision: Item already has an approved claim (hold active).',
        );
      }
      throw error;
    }
  }

  /**
   * FR-18, WF-2: Reject claim with recorded reason.
   */
  async rejectClaim(adminUser: AuthUser, claimId: string, dto: RejectClaimDto) {
    const claim = await this.prisma.claim.findUnique({
      where: { id: claimId },
      include: { item: true },
    });

    if (!claim) {
      throw new NotFoundException(`Claim with ID '${claimId}' not found`);
    }

    this.tenancyService.assertCampusAccess(adminUser.campusId, claim.item.campusId);

    const allowed: ClaimStatus[] = [ClaimStatus.PENDING, ClaimStatus.INFO_REQUESTED];
    if (!allowed.includes(claim.status)) {
      throw new BadRequestException(
        `Cannot reject claim in status '${claim.status}'`,
      );
    }

    const updated = await this.prisma.claim.update({
      where: { id: claimId },
      data: {
        status: ClaimStatus.REJECTED,
        decidedBy: adminUser.id,
        decidedAt: new Date(),
        decisionReason: dto.reason.trim(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: adminUser.id,
        action: 'CLAIM_REJECTED',
        targetType: 'Claim',
        targetId: claimId,
        before: { status: claim.status },
        after: { status: updated.status, reason: dto.reason },
      },
    });

    // FR-29: Notify claimant
    await this.notificationsService.notify({
      userId: claim.claimantId,
      type: NotificationType.CLAIM_REJECTED,
      message: `Your claim for '${claim.item.itemName}' has been rejected. Reason: ${dto.reason}`,
      eventKey: `CLAIM_REJECTED:${claim.id}`,
    });

    return updated;
  }

  /**
   * FR-17: Staff adds verification questions to claim.
   */
  async addQuestions(
    adminUser: AuthUser,
    claimId: string,
    dto: AddQuestionsDto,
  ) {
    const claim = await this.prisma.claim.findUnique({
      where: { id: claimId },
      include: { item: true },
    });

    if (!claim) {
      throw new NotFoundException(`Claim with ID '${claimId}' not found`);
    }

    this.tenancyService.assertCampusAccess(adminUser.campusId, claim.item.campusId);

    await this.prisma.claimQuestion.createMany({
      data: dto.questions.map((q) => ({
        claimId,
        questionText: q.trim(),
        source: QuestionSource.MANUAL,
      })),
    });

    return this.prisma.claimQuestion.findMany({
      where: { claimId },
    });
  }

  /**
   * FR-19, INT-3: Decide an appeal.
   * If ACCEPTED, reopens the claim back to PENDING.
   */
  async decideAppeal(
    adminUser: AuthUser,
    appealId: string,
    dto: DecideAppealDto,
  ) {
    const appeal = await this.prisma.appeal.findUnique({
      where: { id: appealId },
      include: {
        claim: {
          include: { item: true },
        },
      },
    });

    if (!appeal) {
      throw new NotFoundException(`Appeal with ID '${appealId}' not found`);
    }

    this.tenancyService.assertCampusAccess(
      adminUser.campusId,
      appeal.claim.item.campusId,
    );

    if (appeal.status !== AppealStatus.PENDING) {
      throw new BadRequestException(
        `Cannot decide appeal already in status '${appeal.status}'`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Update appeal decision
      const updatedAppeal = await tx.appeal.update({
        where: { id: appealId },
        data: {
          status: dto.status,
          decidedBy: adminUser.id,
          decidedAt: new Date(),
        },
      });

      // 2. INT-3: If appeal accepted, reopen claim to PENDING
      let updatedClaim = null;
      if (dto.status === AppealStatus.ACCEPTED) {
        updatedClaim = await tx.claim.update({
          where: { id: appeal.claimId },
          data: {
            status: ClaimStatus.PENDING,
          },
        });
      }

      // 3. Record audit log
      await tx.auditLog.create({
        data: {
          actorId: adminUser.id,
          action: 'APPEAL_DECIDED',
          targetType: 'Appeal',
          targetId: appealId,
          after: {
            status: dto.status,
            reopened: dto.status === AppealStatus.ACCEPTED,
          },
        },
      });

      return { updatedAppeal, updatedClaim };
    });

    return result;
  }

  private generateCollectionTokenCode(): string {
    const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `${part1}-${part2}`;
  }
}
