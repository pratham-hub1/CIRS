import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { ClaimsService } from '../src/modules/claims/claims.service';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { TenancyService } from '../src/modules/tenancy/tenancy.service';
import { NotificationsService } from '../src/modules/notifications/notifications.service';
import {
  AppealStatus,
  ClaimStatus,
  ItemCategory,
  ItemStatus,
  ItemType,
  Role,
  VerificationLevel,
} from '../src/domain/enums';
import { AuthUser } from '../src/common/interfaces/auth-user.interface';

describe('ClaimsService (Phase 5: FR-15..17, FR-28, INV-DM-2, INT-3)', () => {
  let service: ClaimsService;
  let prisma: any;
  let tenancyService: any;
  let notificationsService: any;

  const mockUser: AuthUser = {
    id: 'claimant-1',
    email: 'claimant@gsfcuniversity.ac.in',
    role: Role.STUDENT,
    campusId: 'campus-1',
  };

  const otherUser: AuthUser = {
    id: 'other-user',
    email: 'other@gsfcuniversity.ac.in',
    role: Role.STUDENT,
    campusId: 'campus-1',
  };

  beforeEach(async () => {
    prisma = {
      item: {
        findUnique: jest.fn(),
      },
      claim: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      claimQuestion: {
        update: jest.fn(),
      },
      claimDocument: {
        create: jest.fn(),
      },
      appeal: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      user: {
        findMany: jest.fn().mockResolvedValue([{ id: 'admin-1' }]),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      },
    };

    tenancyService = {
      assertCampusAccess: jest.fn(),
    };

    notificationsService = {
      notify: jest.fn().mockResolvedValue({ id: 'notif-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClaimsService,
        { provide: PrismaService, useValue: prisma },
        { provide: TenancyService, useValue: tenancyService },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get<ClaimsService>(ClaimsService);
  });

  describe('FR-15, INV-DM-2: Submit Ownership Claim', () => {
    it('creates claim for a FOUND item and auto-assigns risk verification level', async () => {
      prisma.item.findUnique.mockResolvedValue({
        id: 'item-found-1',
        caseId: 'CIRS-2026-000001',
        type: ItemType.FOUND,
        category: ItemCategory.ELECTRONICS,
        campusId: 'campus-1',
        reporterId: 'finder-1',
        status: ItemStatus.FOUND,
        itemName: 'iPhone',
      });

      prisma.claim.findFirst.mockResolvedValue(null);
      prisma.claim.create.mockImplementation(({ data }: any) =>
        Promise.resolve({
          id: 'claim-1',
          ...data,
          createdAt: new Date(),
        }),
      );

      const dto = {
        description: 'Lost my black iPhone near canteen',
        dateLost: '2026-10-10T10:00:00Z',
        placeLost: 'Canteen',
        identifyingMarks: 'Small crack on camera lens',
      };

      const claim = await service.createClaim(mockUser, 'CIRS-2026-000001', dto);

      expect(claim.id).toBe('claim-1');
      expect(claim.itemType).toBe(ItemType.FOUND);
      // FR-16: ELECTRONICS category must derive HIGH verification level
      expect(claim.verificationLevel).toBe(VerificationLevel.HIGH);
      expect(claim.status).toBe(ClaimStatus.PENDING);
      expect(prisma.claim.create).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'CLAIM_SUBMITTED' }),
        }),
      );
    });

    it('INV-DM-2: rejects claim if item is of type LOST', async () => {
      prisma.item.findUnique.mockResolvedValue({
        id: 'item-lost-1',
        caseId: 'CIRS-2026-000002',
        type: ItemType.LOST, // Cannot claim a lost report!
        category: ItemCategory.WALLETS,
        campusId: 'campus-1',
        reporterId: 'user-other',
        status: ItemStatus.LOST_REPORTED,
      });

      const dto = {
        description: 'Claiming',
        dateLost: '2026-10-10T10:00:00Z',
        placeLost: 'Campus',
        identifyingMarks: 'None',
      };

      await expect(
        service.createClaim(mockUser, 'CIRS-2026-000002', dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects claim if claimant was the finder/reporter', async () => {
      prisma.item.findUnique.mockResolvedValue({
        id: 'item-found-1',
        caseId: 'CIRS-2026-000001',
        type: ItemType.FOUND,
        category: ItemCategory.WALLETS,
        campusId: 'campus-1',
        reporterId: mockUser.id, // Same user!
        status: ItemStatus.FOUND,
      });

      const dto = {
        description: 'Claiming my own find',
        dateLost: '2026-10-10T10:00:00Z',
        placeLost: 'Campus',
        identifyingMarks: 'None',
      };

      await expect(
        service.createClaim(mockUser, 'CIRS-2026-000001', dto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('FR-28, WF-2: Claim Withdrawal', () => {
    it('allows claimant to withdraw claim while in PENDING or INFO_REQUESTED status', async () => {
      prisma.claim.findUnique.mockResolvedValue({
        id: 'claim-1',
        claimantId: mockUser.id,
        status: ClaimStatus.PENDING,
      });

      prisma.claim.update.mockResolvedValue({
        id: 'claim-1',
        status: ClaimStatus.WITHDRAWN,
      });

      const res = await service.withdrawClaim(mockUser, 'claim-1');
      expect(res.status).toBe(ClaimStatus.WITHDRAWN);
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'CLAIM_WITHDRAWN' }),
        }),
      );
    });

    it('forbids withdrawing another user claim', async () => {
      prisma.claim.findUnique.mockResolvedValue({
        id: 'claim-1',
        claimantId: otherUser.id,
        status: ClaimStatus.PENDING,
      });

      await expect(
        service.withdrawClaim(mockUser, 'claim-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('FR-18, WF-2: Submit Answers to INFO_REQUESTED', () => {
    it('updates answers and moves claim status back to PENDING', async () => {
      prisma.claim.findUnique.mockResolvedValue({
        id: 'claim-1',
        claimantId: mockUser.id,
        status: ClaimStatus.INFO_REQUESTED,
        questions: [{ id: 'q-1', questionText: 'What is inside?' }],
      });

      prisma.claim.update.mockResolvedValue({
        id: 'claim-1',
        status: ClaimStatus.PENDING,
      });

      const res = await service.submitAnswers(mockUser, 'claim-1', {
        answers: [{ questionId: 'q-1', answerText: 'Drivers license' }],
      });

      expect(res.status).toBe(ClaimStatus.PENDING);
      expect(prisma.claimQuestion.update).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'CLAIM_ANSWERS_SUBMITTED' }),
        }),
      );
    });
  });

  describe('INT-3: Appeals', () => {
    it('allows appeal creation strictly for REJECTED claims', async () => {
      prisma.claim.findUnique.mockResolvedValue({
        id: 'claim-1',
        claimantId: mockUser.id,
        status: ClaimStatus.REJECTED,
      });

      prisma.appeal.findFirst.mockResolvedValue(null);
      prisma.appeal.create.mockResolvedValue({
        id: 'appeal-1',
        claimId: 'claim-1',
        status: AppealStatus.PENDING,
        reason: 'I have additional purchase invoice proof',
      });

      const appeal = await service.createAppeal(mockUser, 'claim-1', {
        reason: 'I have additional purchase invoice proof',
      });

      expect(appeal.id).toBe('appeal-1');
      expect(appeal.status).toBe(AppealStatus.PENDING);
    });

    it('INT-3: rejects appeal creation if claim is not REJECTED', async () => {
      prisma.claim.findUnique.mockResolvedValue({
        id: 'claim-1',
        claimantId: mockUser.id,
        status: ClaimStatus.PENDING, // Not rejected!
      });

      await expect(
        service.createAppeal(mockUser, 'claim-1', {
          reason: 'Premature appeal',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
