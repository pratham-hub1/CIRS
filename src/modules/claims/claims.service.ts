import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenancyService } from '../tenancy/tenancy.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { SubmitAnswersDto } from './dto/submit-answers.dto';
import { CreateAppealDto } from './dto/create-appeal.dto';
import { AddDocumentDto } from './dto/add-document.dto';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import {
  AppealStatus,
  ClaimStatus,
  ItemStatus,
  ItemType,
  NotificationType,
  QuestionSource,
  Role,
  CATEGORY_VERIFICATION_LEVEL_MAP,
} from '../../domain/enums';
import { getVerificationQuestionsForCategory } from '../../domain/verification-questions';

@Injectable()
export class ClaimsService {
  private readonly logger = new Logger(ClaimsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancyService: TenancyService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * FR-15, INV-DM-2: Submit an ownership claim for a FOUND item.
   */
  async createClaim(user: AuthUser, caseId: string, dto: CreateClaimDto) {
    const item = await this.prisma.item.findUnique({
      where: { caseId },
    });

    if (!item) {
      throw new NotFoundException(`Case with ID '${caseId}' not found`);
    }

    // Tenancy check (INT-6)
    this.tenancyService.assertCampusAccess(user.campusId, item.campusId);

    // INV-DM-2: A claim is always for a FOUND item
    if (item.type !== ItemType.FOUND) {
      throw new BadRequestException(
        'Claims can only be submitted for FOUND items',
      );
    }

    // Claimant cannot be the finder/reporter
    if (item.reporterId === user.id) {
      throw new BadRequestException('You cannot claim an item you reported as found');
    }

    // Item must be in a claimable status
    if (
      item.status === ItemStatus.RETURNED ||
      item.status === ItemStatus.ARCHIVED ||
      item.status === ItemStatus.UNCLAIMED
    ) {
      throw new BadRequestException(
        `Cannot claim item in status '${item.status}'`,
      );
    }

    // Prevent duplicate active claims by same user on same item
    const existingActiveClaim = await this.prisma.claim.findFirst({
      where: {
        itemId: item.id,
        claimantId: user.id,
        status: {
          in: [ClaimStatus.PENDING, ClaimStatus.INFO_REQUESTED, ClaimStatus.APPROVED],
        },
      },
    });

    if (existingActiveClaim) {
      throw new ConflictException(
        'You already have an active claim submitted for this item',
      );
    }

    // FR-16: Risk-based verification level derived from category
    const verificationLevel =
      CATEGORY_VERIFICATION_LEVEL_MAP[item.category];

    // FR-17: Proposed category-specific questions
    const defaultQuestions = getVerificationQuestionsForCategory(item.category);

    // Prepare questions with any answers provided upfront in DTO
    const questionsToCreate: {
      questionText: string;
      source: QuestionSource;
      answerText: string | null;
      answeredAt: Date | null;
    }[] = defaultQuestions.map((qText) => {
      const match = dto.answers?.find(
        (a) => a.questionText.trim().toLowerCase() === qText.trim().toLowerCase(),
      );
      return {
        questionText: qText,
        source: QuestionSource.AUTO,
        answerText: match ? match.answerText.trim() : null,
        answeredAt: match ? new Date() : null,
      };
    });

    // Append any extra questions answered in DTO
    if (dto.answers) {
      for (const ans of dto.answers) {
        const alreadyIncluded = questionsToCreate.some(
          (q) => q.questionText.trim().toLowerCase() === ans.questionText.trim().toLowerCase(),
        );
        if (!alreadyIncluded) {
          questionsToCreate.push({
            questionText: ans.questionText.trim(),
            source: QuestionSource.MANUAL,
            answerText: ans.answerText.trim(),
            answeredAt: new Date(),
          });
        }
      }
    }

    const claim = await this.prisma.claim.create({
      data: {
        itemId: item.id,
        itemType: ItemType.FOUND,
        claimantId: user.id,
        description: dto.description.trim(),
        dateLost: new Date(dto.dateLost),
        placeLost: dto.placeLost.trim(),
        identifyingMarks: dto.identifyingMarks.trim(),
        verificationLevel,
        status: ClaimStatus.PENDING,
        questions: {
          create: questionsToCreate,
        },
        documents: dto.documents && dto.documents.length > 0
          ? {
              create: dto.documents.map((doc) => ({
                url: doc.url,
                docType: doc.docType,
              })),
            }
          : undefined,
      },
      include: {
        questions: true,
        documents: true,
      },
    });

    // Record audit log (FR-37, INV-DM-8)
    await this.prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'CLAIM_SUBMITTED',
        targetType: 'Claim',
        targetId: claim.id,
        after: {
          itemId: item.id,
          verificationLevel: claim.verificationLevel,
          status: claim.status,
        },
      },
    });

    // FR-29: Notify staff (ADMIN) about new claim
    const adminStaff = await this.prisma.user.findMany({
      where: {
        campusId: user.campusId,
        role: Role.ADMIN,
      },
      select: { id: true },
    });

    for (const admin of adminStaff) {
      await this.notificationsService.notify({
        userId: admin.id,
        type: NotificationType.NEW_CLAIM,
        message: `New claim submitted for item '${item.itemName}' (${item.caseId}) by ${user.email}`,
        eventKey: `NEW_CLAIM:${claim.id}:${admin.id}`,
      });
    }

    return claim;
  }

  /**
   * List claims submitted by the current user.
   */
  async getMyClaims(user: AuthUser) {
    return this.prisma.claim.findMany({
      where: { claimantId: user.id },
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
        questions: true,
        documents: true,
        appeals: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get single claim detail.
   */
  async getClaimById(user: AuthUser, claimId: string) {
    const claim = await this.prisma.claim.findUnique({
      where: { id: claimId },
      include: {
        item: {
          include: {
            storageLocation: true,
          },
        },
        claimant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        questions: true,
        documents: true,
        appeals: true,
        collectionToken: true,
      },
    });

    if (!claim) {
      throw new NotFoundException(`Claim with ID '${claimId}' not found`);
    }

    // Only claimant or staff/ADMIN can view claim detail
    const isOwner = claim.claimantId === user.id;
    const isStaff = user.role === Role.ADMIN;

    if (!isOwner && !isStaff) {
      throw new ForbiddenException('You do not have permission to view this claim');
    }

    return claim;
  }

  /**
   * FR-28, WF-2: Claimant withdraws their claim.
   */
  async withdrawClaim(user: AuthUser, claimId: string) {
    const claim = await this.prisma.claim.findUnique({
      where: { id: claimId },
    });

    if (!claim) {
      throw new NotFoundException(`Claim with ID '${claimId}' not found`);
    }

    if (claim.claimantId !== user.id) {
      throw new ForbiddenException('You can only withdraw your own claim');
    }

    // WF-2: Allowed from PENDING or INFO_REQUESTED to WITHDRAWN
    const allowed: ClaimStatus[] = [ClaimStatus.PENDING, ClaimStatus.INFO_REQUESTED];
    if (!allowed.includes(claim.status)) {
      throw new BadRequestException(
        `Cannot withdraw claim in status '${claim.status}'`,
      );
    }

    const updated = await this.prisma.claim.update({
      where: { id: claimId },
      data: {
        status: ClaimStatus.WITHDRAWN,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'CLAIM_WITHDRAWN',
        targetType: 'Claim',
        targetId: claim.id,
        before: { status: claim.status },
        after: { status: updated.status },
      },
    });

    return {
      message: 'Claim withdrawn successfully',
      status: updated.status,
    };
  }

  /**
   * FR-18, WF-2: Claimant submits answers to INFO_REQUESTED questions.
   * Advances claim status back to PENDING.
   */
  async submitAnswers(user: AuthUser, claimId: string, dto: SubmitAnswersDto) {
    const claim = await this.prisma.claim.findUnique({
      where: { id: claimId },
      include: { questions: true },
    });

    if (!claim) {
      throw new NotFoundException(`Claim with ID '${claimId}' not found`);
    }

    if (claim.claimantId !== user.id) {
      throw new ForbiddenException('You can only answer questions for your own claim');
    }

    if (claim.status !== ClaimStatus.INFO_REQUESTED && claim.status !== ClaimStatus.PENDING) {
      throw new BadRequestException(
        `Cannot submit answers for claim in status '${claim.status}'`,
      );
    }

    for (const ans of dto.answers) {
      const q = claim.questions.find((x) => x.id === ans.questionId);
      if (q) {
        await this.prisma.claimQuestion.update({
          where: { id: ans.questionId },
          data: {
            answerText: ans.answerText.trim(),
            answeredAt: new Date(),
          },
        });
      }
    }

    // WF-2: Transition INFO_REQUESTED -> PENDING
    const updated = await this.prisma.claim.update({
      where: { id: claimId },
      data: {
        status: ClaimStatus.PENDING,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'CLAIM_ANSWERS_SUBMITTED',
        targetType: 'Claim',
        targetId: claim.id,
        before: { status: claim.status },
        after: { status: updated.status },
      },
    });

    return updated;
  }

  /**
   * Upload additional supporting document for claim.
   */
  async addDocument(user: AuthUser, claimId: string, dto: AddDocumentDto) {
    const claim = await this.prisma.claim.findUnique({
      where: { id: claimId },
    });

    if (!claim) {
      throw new NotFoundException(`Claim with ID '${claimId}' not found`);
    }

    if (claim.claimantId !== user.id) {
      throw new ForbiddenException('You can only upload documents for your own claim');
    }

    if (
      claim.status !== ClaimStatus.PENDING &&
      claim.status !== ClaimStatus.INFO_REQUESTED
    ) {
      throw new BadRequestException(
        `Cannot add documents to claim in status '${claim.status}'`,
      );
    }

    return this.prisma.claimDocument.create({
      data: {
        claimId,
        url: dto.url,
        docType: dto.docType,
      },
    });
  }

  /**
   * FR-19, INT-3: Submit appeal against a REJECTED claim.
   */
  async createAppeal(user: AuthUser, claimId: string, dto: CreateAppealDto) {
    const claim = await this.prisma.claim.findUnique({
      where: { id: claimId },
    });

    if (!claim) {
      throw new NotFoundException(`Claim with ID '${claimId}' not found`);
    }

    if (claim.claimantId !== user.id) {
      throw new ForbiddenException('You can only appeal your own claim');
    }

    // INT-3: An appeal exists ONLY for a REJECTED claim!
    if (claim.status !== ClaimStatus.REJECTED) {
      throw new BadRequestException(
        `Appeals can only be submitted for REJECTED claims (current status: '${claim.status}')`,
      );
    }

    // Check if pending appeal already exists
    const existingAppeal = await this.prisma.appeal.findFirst({
      where: {
        claimId,
        status: AppealStatus.PENDING,
      },
    });

    if (existingAppeal) {
      throw new ConflictException('A pending appeal already exists for this claim');
    }

    const appeal = await this.prisma.appeal.create({
      data: {
        claimId,
        appellantId: user.id,
        reason: dto.reason.trim(),
        status: AppealStatus.PENDING,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'CLAIM_APPEALED',
        targetType: 'Appeal',
        targetId: appeal.id,
        after: {
          claimId,
          reason: appeal.reason,
        },
      },
    });

    return appeal;
  }
}
