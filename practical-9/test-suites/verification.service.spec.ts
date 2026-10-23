import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { VerificationService } from '../src/modules/verification/verification.service';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { TenancyService } from '../src/modules/tenancy/tenancy.service';
import { NotificationsService } from '../src/modules/notifications/notifications.service';
import {
  AppealStatus,
  ClaimStatus,
  ItemStatus,
  NotificationType,
  Role,
} from '../src/domain/enums';
import { AuthUser } from '../src/common/interfaces/auth-user.interface';

describe('VerificationService (Phase 5: WF-2, INT-1, INT-3, INT-7, INV-DM-4)', () => {
  let service: VerificationService;
  let prisma: any;
  let tenancyService: any;
  let notificationsService: any;

  const mockAdmin: AuthUser = {
    id: 'admin-1',
    email: 'admin@gsfcuniversity.ac.in',
    role: Role.ADMIN,
    campusId: 'campus-1',
  };

  beforeEach(async () => {
    prisma = {
      claim: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      item: {
        update: jest.fn(),
      },
      collectionToken: {
        create: jest.fn(),
      },
      claimQuestion: {
        createMany: jest.fn(),
        findMany: jest.fn(),
      },
      appeal: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    tenancyService = {
      assertCampusAccess: jest.fn(),
    };

    notificationsService = {
      notify: jest.fn().mockResolvedValue({ id: 'notif-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerificationService,
        { provide: PrismaService, useValue: prisma },
        { provide: TenancyService, useValue: tenancyService },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get<VerificationService>(VerificationService);
  });

  describe('WF-2: Request More Information', () => {
    it('moves claim to INFO_REQUESTED, attaches staff questions, and notifies claimant', async () => {
      prisma.claim.findUnique.mockResolvedValue({
        id: 'claim-1',
        status: ClaimStatus.PENDING,
        claimantId: 'user-1',
        item: { id: 'item-1', campusId: 'campus-1', itemName: 'Wallet' },
      });

      prisma.claim.update.mockResolvedValue({
        id: 'claim-1',
        status: ClaimStatus.INFO_REQUESTED,
      });

      const res = await service.requestMoreInfo(mockAdmin, 'claim-1', {
        reason: 'Please specify the colour of the inner pouch',
        questions: ['What colour is the inner pouch?'],
      });

      expect(res.status).toBe(ClaimStatus.INFO_REQUESTED);
      expect(prisma.claimQuestion.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            claimId: 'claim-1',
            questionText: 'What colour is the inner pouch?',
            source: 'MANUAL',
          }),
        ],
      });
      expect(notificationsService.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          type: NotificationType.MORE_INFO_NEEDED,
        }),
      );
    });
  });

  describe('INV-DM-4, WF-2, INT-1, INT-7: Claim Approval & Single Hold Concurrency', () => {
    it('approving a claim creates hold, advances item to READY_FOR_COLLECTION, and issues single-use token', async () => {
      const claim = {
        id: 'claim-1',
        itemId: 'item-1',
        claimantId: 'user-1',
        status: ClaimStatus.PENDING,
        item: {
          id: 'item-1',
          caseId: 'CIRS-2026-000001',
          campusId: 'campus-1',
          status: ItemStatus.FOUND,
          itemName: 'iPhone',
        },
      };

      prisma.claim.findUnique.mockResolvedValue(claim);
      // No existing approved claim
      prisma.claim.findFirst.mockResolvedValue(null);

      prisma.claim.update.mockResolvedValue({
        ...claim,
        status: ClaimStatus.APPROVED,
      });

      prisma.item.update.mockResolvedValue({
        ...claim.item,
        status: ItemStatus.READY_FOR_COLLECTION,
      });

      prisma.collectionToken.create.mockImplementation(({ data }: any) =>
        Promise.resolve({
          id: 'token-1',
          ...data,
        }),
      );

      const result = await service.approveClaim(mockAdmin, 'claim-1');

      expect(result.status).toBe(ClaimStatus.APPROVED);
      expect(result.holdCreated).toBe(true);
      expect(result.collectionToken.issued).toBe(true);
      expect(result.collectionToken.code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);

      // Verify item advanced to READY_FOR_COLLECTION in transaction (INT-1)
      expect(prisma.item.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { status: ItemStatus.READY_FOR_COLLECTION },
      });

      // Verify notification sent with pickup code
      expect(notificationsService.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          type: NotificationType.CLAIM_APPROVED,
        }),
      );
    });

    it('INV-DM-4, INT-7: rejects second approval when another claim is already APPROVED on same item', async () => {
      const claim2 = {
        id: 'claim-2',
        itemId: 'item-1',
        claimantId: 'user-2',
        status: ClaimStatus.PENDING,
        item: {
          id: 'item-1',
          caseId: 'CIRS-2026-000001',
          campusId: 'campus-1',
          status: ItemStatus.READY_FOR_COLLECTION,
        },
      };

      prisma.claim.findUnique.mockResolvedValue(claim2);
      // Already an approved claim on this item!
      prisma.claim.findFirst.mockResolvedValue({
        id: 'claim-1',
        itemId: 'item-1',
        status: ClaimStatus.APPROVED,
      });

      await expect(service.approveClaim(mockAdmin, 'claim-2')).rejects.toThrow(
        ConflictException,
      );
    });

    it('INV-DM-4: handles database P2002 partial unique index violation under racing approvals', async () => {
      const claim = {
        id: 'claim-race',
        itemId: 'item-1',
        claimantId: 'user-3',
        status: ClaimStatus.PENDING,
        item: {
          id: 'item-1',
          campusId: 'campus-1',
          status: ItemStatus.FOUND,
        },
      };

      prisma.claim.findUnique.mockResolvedValue(claim);
      prisma.claim.findFirst.mockResolvedValue(null);

      // Simulate database throwing unique index violation (partial unique index on itemId WHERE status='APPROVED')
      prisma.$transaction.mockRejectedValue({ code: 'P2002' });

      await expect(
        service.approveClaim(mockAdmin, 'claim-race'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('WF-2: Rejection', () => {
    it('rejects claim with recorded reason and notifies claimant', async () => {
      const claim = {
        id: 'claim-1',
        claimantId: 'user-1',
        status: ClaimStatus.PENDING,
        item: { id: 'item-1', campusId: 'campus-1', itemName: 'Keys' },
      };

      prisma.claim.findUnique.mockResolvedValue(claim);
      prisma.claim.update.mockResolvedValue({
        id: 'claim-1',
        status: ClaimStatus.REJECTED,
      });

      const res = await service.rejectClaim(mockAdmin, 'claim-1', {
        reason: 'Identifying marks did not match item',
      });

      expect(res.status).toBe(ClaimStatus.REJECTED);
      expect(notificationsService.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          type: NotificationType.CLAIM_REJECTED,
        }),
      );
    });
  });

  describe('INT-3: Appeal Decision', () => {
    it('accepting appeal reopens claim back to PENDING (WF-2, INT-3)', async () => {
      const appeal = {
        id: 'appeal-1',
        claimId: 'claim-rejected',
        status: AppealStatus.PENDING,
        claim: {
          id: 'claim-rejected',
          status: ClaimStatus.REJECTED,
          item: { campusId: 'campus-1' },
        },
      };

      prisma.appeal.findUnique.mockResolvedValue(appeal);
      prisma.appeal.update.mockResolvedValue({
        id: 'appeal-1',
        status: AppealStatus.ACCEPTED,
      });
      prisma.claim.update.mockResolvedValue({
        id: 'claim-rejected',
        status: ClaimStatus.PENDING,
      });

      const res = await service.decideAppeal(mockAdmin, 'appeal-1', {
        status: AppealStatus.ACCEPTED,
      });

      expect(res.updatedAppeal.status).toBe(AppealStatus.ACCEPTED);
      expect(prisma.claim.update).toHaveBeenCalledWith({
        where: { id: 'claim-rejected' },
        data: { status: ClaimStatus.PENDING },
      });
    });
  });
});
