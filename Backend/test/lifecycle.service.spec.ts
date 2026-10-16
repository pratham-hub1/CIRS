import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { LifecycleService } from '../src/modules/lifecycle/lifecycle.service';
import { ScheduledJobsService } from '../src/modules/lifecycle/scheduled-jobs.service';
import { TenancyService } from '../src/modules/tenancy/tenancy.service';
import { NotificationsService } from '../src/modules/notifications/notifications.service';
import {
  Role,
  ItemType,
  ItemCategory,
  ItemStatus,
  ClaimStatus,
  VerificationLevel,
} from '../src/domain/enums';
import { AuthUser } from '../src/common/interfaces/auth-user.interface';

describe('LifecycleModule: LifecycleService & ScheduledJobsService (Phase 6)', () => {
  let lifecycleService: LifecycleService;
  let scheduledJobsService: ScheduledJobsService;
  let prismaMock: any;
  let notificationsServiceMock: any;
  let tenancyService: TenancyService;

  const mockAdminUser: AuthUser = {
    id: 'admin-user-uuid',
    email: 'admin@gsfcuniversity.ac.in',
    role: Role.ADMIN,
    campusId: 'campus-1-uuid',
  };

  const mockClaimantUser: AuthUser = {
    id: 'claimant-user-uuid',
    email: 'claimant@gsfcuniversity.ac.in',
    role: Role.STUDENT,
    campusId: 'campus-1-uuid',
  };

  const mockReporterUser: AuthUser = {
    id: 'reporter-user-uuid',
    email: 'finder@gsfcuniversity.ac.in',
    role: Role.STUDENT,
    campusId: 'campus-1-uuid',
  };

  beforeEach(() => {
    prismaMock = {
      item: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      claim: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      collectionToken: {
        updateMany: jest.fn(),
      },
      user: {
        findMany: jest.fn(),
      },
      notificationPreference: {
        findMany: jest.fn(),
      },
      notification: {
        findMany: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    };

    notificationsServiceMock = {
      notify: jest.fn().mockResolvedValue({ id: 'mock-notif-uuid' }),
    };

    tenancyService = new TenancyService(prismaMock);
    lifecycleService = new LifecycleService(
      prismaMock,
      tenancyService,
      notificationsServiceMock,
    );
    scheduledJobsService = new ScheduledJobsService(
      prismaMock,
      notificationsServiceMock,
    );
  });

  describe('WF-4: Two-Way Handover Atomicity', () => {
    it('only staff handover recorded -> item remains in READY_FOR_COLLECTION (half-completed cannot reach RETURNED)', async () => {
      const mockItem = {
        id: 'item-1',
        caseId: 'CIRS-2026-000001',
        itemName: 'HP Laptop',
        status: ItemStatus.READY_FOR_COLLECTION,
        campusId: 'campus-1-uuid',
        reporterId: mockReporterUser.id,
      };

      const mockClaim = {
        id: 'claim-1',
        itemId: 'item-1',
        claimantId: mockClaimantUser.id,
        status: ClaimStatus.APPROVED,
        handoverAt: null,
        receiptConfirmedAt: null,
        handoverOverrideBy: null,
      };

      prismaMock.item.findUnique.mockResolvedValue(mockItem);
      prismaMock.claim.findFirst.mockResolvedValue(mockClaim);
      prismaMock.claim.update.mockResolvedValue({
        ...mockClaim,
        handoverAt: new Date(),
      });

      const result = await lifecycleService.staffHandover(
        'CIRS-2026-000001',
        {},
        mockAdminUser,
      );

      expect(result.itemStatus).toBe(ItemStatus.READY_FOR_COLLECTION);
      expect(result.isFullyReturned).toBe(false);
      expect(prismaMock.item.update).not.toHaveBeenCalled();
      expect(notificationsServiceMock.notify).not.toHaveBeenCalled();
    });

    it('only user receipt confirmed -> item remains in READY_FOR_COLLECTION', async () => {
      const mockItem = {
        id: 'item-1',
        caseId: 'CIRS-2026-000001',
        itemName: 'HP Laptop',
        status: ItemStatus.READY_FOR_COLLECTION,
        campusId: 'campus-1-uuid',
        reporterId: mockReporterUser.id,
      };

      const mockClaim = {
        id: 'claim-1',
        itemId: 'item-1',
        claimantId: mockClaimantUser.id,
        status: ClaimStatus.APPROVED,
        handoverAt: null,
        receiptConfirmedAt: null,
        handoverOverrideBy: null,
      };

      prismaMock.item.findUnique.mockResolvedValue(mockItem);
      prismaMock.claim.findFirst.mockResolvedValue(mockClaim);
      prismaMock.claim.update.mockResolvedValue({
        ...mockClaim,
        receiptConfirmedAt: new Date(),
      });

      const result = await lifecycleService.confirmReceipt(
        'CIRS-2026-000001',
        mockClaimantUser,
      );

      expect(result.itemStatus).toBe(ItemStatus.READY_FOR_COLLECTION);
      expect(result.isFullyReturned).toBe(false);
      expect(prismaMock.item.update).not.toHaveBeenCalled();
    });

    it('both staff handover and user receipt present -> item transitions to RETURNED', async () => {
      const mockItem = {
        id: 'item-1',
        caseId: 'CIRS-2026-000001',
        itemName: 'HP Laptop',
        status: ItemStatus.READY_FOR_COLLECTION,
        campusId: 'campus-1-uuid',
        reporterId: mockReporterUser.id,
      };

      // User has already confirmed receipt earlier
      const mockClaim = {
        id: 'claim-1',
        itemId: 'item-1',
        claimantId: mockClaimantUser.id,
        status: ClaimStatus.APPROVED,
        handoverAt: null,
        receiptConfirmedAt: new Date('2026-10-16T10:00:00Z'),
        handoverOverrideBy: null,
      };

      prismaMock.item.findUnique.mockResolvedValue(mockItem);
      prismaMock.claim.findFirst.mockResolvedValue(mockClaim);
      prismaMock.claim.update.mockResolvedValue({
        ...mockClaim,
        handoverAt: new Date(),
      });
      prismaMock.item.update.mockResolvedValue({
        ...mockItem,
        status: ItemStatus.RETURNED,
      });

      const result = await lifecycleService.staffHandover(
        'CIRS-2026-000001',
        {},
        mockAdminUser,
      );

      expect(result.itemStatus).toBe(ItemStatus.RETURNED);
      expect(result.isFullyReturned).toBe(true);
      expect(prismaMock.item.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { status: ItemStatus.RETURNED },
      });
      expect(notificationsServiceMock.notify).toHaveBeenCalledTimes(2); // claimant and reporter
    });

    it('staff override with reason -> immediately transitions item to RETURNED', async () => {
      const mockItem = {
        id: 'item-1',
        caseId: 'CIRS-2026-000001',
        itemName: 'HP Laptop',
        status: ItemStatus.READY_FOR_COLLECTION,
        campusId: 'campus-1-uuid',
        reporterId: mockReporterUser.id,
      };

      const mockClaim = {
        id: 'claim-1',
        itemId: 'item-1',
        claimantId: mockClaimantUser.id,
        status: ClaimStatus.APPROVED,
        handoverAt: null,
        receiptConfirmedAt: null,
        handoverOverrideBy: null,
      };

      prismaMock.item.findUnique.mockResolvedValue(mockItem);
      prismaMock.claim.findFirst.mockResolvedValue(mockClaim);
      prismaMock.claim.update.mockResolvedValue({
        ...mockClaim,
        handoverAt: new Date(),
        handoverOverrideBy: mockAdminUser.id,
        handoverOverrideReason: 'Student phone battery dead, verified physical ID',
      });
      prismaMock.item.update.mockResolvedValue({
        ...mockItem,
        status: ItemStatus.RETURNED,
      });

      const result = await lifecycleService.staffHandover(
        'CIRS-2026-000001',
        {
          override: true,
          overrideReason: 'Student phone battery dead, verified physical ID',
        },
        mockAdminUser,
      );

      expect(result.itemStatus).toBe(ItemStatus.RETURNED);
      expect(result.isFullyReturned).toBe(true);
      expect(prismaMock.item.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { status: ItemStatus.RETURNED },
      });
    });

    it('staff override without reason is strictly rejected (fail-fast)', async () => {
      const mockItem = {
        id: 'item-1',
        caseId: 'CIRS-2026-000001',
        status: ItemStatus.READY_FOR_COLLECTION,
        campusId: 'campus-1-uuid',
      };

      prismaMock.item.findUnique.mockResolvedValue(mockItem);
      prismaMock.claim.findFirst.mockResolvedValue({
        id: 'claim-1',
        status: ClaimStatus.APPROVED,
      });

      await expect(
        lifecycleService.staffHandover(
          'CIRS-2026-000001',
          { override: true, overrideReason: '   ' },
          mockAdminUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('INV-DM-5 & INT-7: Collection Token Single-Use Under Concurrency', () => {
    it('successful first redemption sets usedAt and records staff handover', async () => {
      const mockClaim = {
        id: 'claim-1',
        item: {
          id: 'item-1',
          campusId: 'campus-1-uuid',
          status: ItemStatus.READY_FOR_COLLECTION,
          itemName: 'Dell Laptop',
        },
        collectionToken: {
          id: 'token-1',
          code: 'CIRS-789012',
          expiresAt: new Date(Date.now() + 100000),
          usedAt: null,
        },
      };

      prismaMock.claim.findUnique.mockResolvedValue(mockClaim);
      prismaMock.collectionToken.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.claim.update.mockResolvedValue({
        ...mockClaim,
        handoverAt: new Date(),
        receiptConfirmedAt: null,
      });

      const result = await lifecycleService.redeemToken(
        'claim-1',
        { code: 'CIRS-789012' },
        mockAdminUser,
      );

      expect(result.success).toBe(true);
      expect(prismaMock.collectionToken.updateMany).toHaveBeenCalledWith({
        where: { id: 'token-1', usedAt: null },
        data: { usedAt: expect.any(Date) },
      });
      expect(prismaMock.claim.update).toHaveBeenCalledWith({
        where: { id: 'claim-1' },
        data: { handoverAt: expect.any(Date) },
      });
    });

    it('concurrent or second redemption fails with ConflictException (INT-7)', async () => {
      const mockClaim = {
        id: 'claim-1',
        item: {
          id: 'item-1',
          campusId: 'campus-1-uuid',
          status: ItemStatus.READY_FOR_COLLECTION,
          itemName: 'Dell Laptop',
        },
        collectionToken: {
          id: 'token-1',
          code: 'CIRS-789012',
          expiresAt: new Date(Date.now() + 100000),
          usedAt: null,
        },
      };

      prismaMock.claim.findUnique.mockResolvedValue(mockClaim);
      // Simulates losing the race: count is 0 because usedAt is no longer null
      prismaMock.collectionToken.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        lifecycleService.redeemToken(
          'claim-1',
          { code: 'CIRS-789012' },
          mockAdminUser,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects expired collection token', async () => {
      const mockClaim = {
        id: 'claim-1',
        item: {
          id: 'item-1',
          campusId: 'campus-1-uuid',
          status: ItemStatus.READY_FOR_COLLECTION,
        },
        collectionToken: {
          id: 'token-1',
          code: 'CIRS-789012',
          expiresAt: new Date(Date.now() - 1000), // Expired
          usedAt: null,
        },
      };

      prismaMock.claim.findUnique.mockResolvedValue(mockClaim);

      await expect(
        lifecycleService.redeemToken(
          'claim-1',
          { code: 'CIRS-789012' },
          mockAdminUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('FR-25: Post-Return Confirmation & Feedback', () => {
    it('claimant can submit feedback on returned item', async () => {
      const mockClaim = {
        id: 'claim-1',
        claimantId: mockClaimantUser.id,
        item: {
          id: 'item-1',
          status: ItemStatus.RETURNED,
          campusId: 'campus-1-uuid',
        },
        handoverAt: new Date(),
      };

      prismaMock.claim.findUnique.mockResolvedValue(mockClaim);
      prismaMock.claim.update.mockResolvedValue({
        ...mockClaim,
        postReturnFeedback: JSON.stringify({ isCorrectItem: true }),
      });

      const res = await lifecycleService.postReturnFeedback(
        'claim-1',
        { isCorrectItem: true, comments: 'Got my exact laptop back!' },
        mockClaimantUser,
      );

      expect(res).toBeDefined();
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'POST_RETURN_FEEDBACK_RECORDED',
        }),
      });
    });

    it('negative feedback flags discrepancy for staff review', async () => {
      const mockClaim = {
        id: 'claim-1',
        claimantId: mockClaimantUser.id,
        item: {
          id: 'item-1',
          itemName: 'Wallet',
          caseId: 'CIRS-2026-000002',
          status: ItemStatus.RETURNED,
          campusId: 'campus-1-uuid',
        },
        handoverAt: new Date(),
      };

      prismaMock.claim.findUnique.mockResolvedValue(mockClaim);
      prismaMock.claim.update.mockResolvedValue(mockClaim);
      prismaMock.user.findMany.mockResolvedValue([mockAdminUser]);

      await lifecycleService.postReturnFeedback(
        'claim-1',
        { isCorrectItem: false, comments: 'Different brand inside the case!' },
        mockClaimantUser,
      );

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'FLAG_RETURN_DISCREPANCY',
        }),
      });
      expect(notificationsServiceMock.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockAdminUser.id,
          message: expect.stringContaining('DISCREPANCY FLAGGED'),
        }),
      );
    });

    it('non-owner cannot submit post-return feedback', async () => {
      const mockClaim = {
        id: 'claim-1',
        claimantId: 'other-user-uuid',
        item: { id: 'item-1', status: ItemStatus.RETURNED },
      };

      prismaMock.claim.findUnique.mockResolvedValue(mockClaim);

      await expect(
        lifecycleService.postReturnFeedback(
          'claim-1',
          { isCorrectItem: true },
          mockClaimantUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('FR-26 & FR-27: Archiving and Unclaimed Lifecycle', () => {
    it('archiveItem only succeeds for RETURNED or closed LOST_REPORTED cases', async () => {
      const mockItem = {
        id: 'item-1',
        caseId: 'CIRS-2026-000001',
        status: ItemStatus.RETURNED,
        campusId: 'campus-1-uuid',
      };

      prismaMock.item.findUnique.mockResolvedValue(mockItem);
      prismaMock.item.update.mockResolvedValue({
        ...mockItem,
        status: ItemStatus.ARCHIVED,
      });

      const res = await lifecycleService.archiveItem(
        'CIRS-2026-000001',
        mockAdminUser,
      );

      expect(res.status).toBe(ItemStatus.ARCHIVED);
    });

    it('archiveItem throws BadRequestException on active FOUND item', async () => {
      const mockItem = {
        id: 'item-1',
        caseId: 'CIRS-2026-000001',
        status: ItemStatus.FOUND,
        campusId: 'campus-1-uuid',
      };

      prismaMock.item.findUnique.mockResolvedValue(mockItem);

      await expect(
        lifecycleService.archiveItem('CIRS-2026-000001', mockAdminUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('markUnclaimed transitions FOUND item to UNCLAIMED', async () => {
      const mockItem = {
        id: 'item-1',
        caseId: 'CIRS-2026-000001',
        status: ItemStatus.FOUND,
        campusId: 'campus-1-uuid',
      };

      prismaMock.item.findUnique.mockResolvedValue(mockItem);
      prismaMock.item.update.mockResolvedValue({
        ...mockItem,
        status: ItemStatus.UNCLAIMED,
      });

      const res = await lifecycleService.markUnclaimed(
        'CIRS-2026-000001',
        mockAdminUser,
      );

      expect(res.status).toBe(ItemStatus.UNCLAIMED);
    });
  });

  describe('INT-11: Scheduled Jobs Idempotency', () => {
    it('escalatePendingClaims notifies staff with deterministic SLA_ESCALATION key', async () => {
      const overdueClaim = {
        id: 'claim-overdue-1',
        item: {
          id: 'item-1',
          itemName: 'Keys',
          caseId: 'CIRS-2026-000003',
          campusId: 'campus-1-uuid',
        },
        createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000), // 72 hours ago
      };

      prismaMock.claim.findMany.mockResolvedValue([overdueClaim]);
      prismaMock.user.findMany.mockResolvedValue([mockAdminUser]);

      const count = await scheduledJobsService.escalatePendingClaims(48);

      expect(count).toBe(1);
      expect(notificationsServiceMock.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockAdminUser.id,
          eventKey: expect.stringMatching(/^SLA_ESCALATION:claim-overdue-1:/),
        }),
      );
    });
  });
});
