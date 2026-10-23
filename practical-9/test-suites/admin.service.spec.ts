import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AdminService } from '../src/modules/admin/admin.service';
import { AuditService } from '../src/modules/audit/audit.service';
import { TenancyService } from '../src/modules/tenancy/tenancy.service';
import {
  Role,
  ItemType,
  ItemCategory,
  ItemStatus,
  ClaimStatus,
  StorageLocationName,
} from '../src/domain/enums';
import { AuthUser } from '../src/common/interfaces/auth-user.interface';

describe('AdminModule: AdminService & AuditService (Phase 7)', () => {
  let adminService: AdminService;
  let auditService: AuditService;
  let tenancyService: TenancyService;
  let prismaMock: any;

  const mockAdminUser: AuthUser = {
    id: 'admin-user-uuid',
    email: 'admin@gsfcuniversity.ac.in',
    role: Role.ADMIN,
    campusId: 'campus-1-uuid',
  };

  beforeEach(() => {
    prismaMock = {
      item: {
        count: jest.fn(),
        findMany: jest.fn(),
        groupBy: jest.fn(),
      },
      storageLocation: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      claim: {
        count: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
      },
    };

    tenancyService = new TenancyService(prismaMock);
    auditService = new AuditService(prismaMock);
    adminService = new AdminService(prismaMock, tenancyService, auditService);
  });

  describe('FR-33 & INT-6: Administrative Cases Listing & Scoping', () => {
    it('getItems applies campus scoping and filters', async () => {
      prismaMock.item.count.mockResolvedValue(1);
      prismaMock.item.findMany.mockResolvedValue([
        {
          id: 'item-1',
          caseId: 'CIRS-2026-000001',
          itemName: 'MacBook Air',
          category: ItemCategory.ELECTRONICS,
          campusId: mockAdminUser.campusId,
        },
      ]);

      const res = await adminService.getItems(mockAdminUser, {
        category: ItemCategory.ELECTRONICS,
        search: 'MacBook',
        page: 1,
        limit: 10,
      });

      expect(res.total).toBe(1);
      expect(res.items.length).toBe(1);
      expect(prismaMock.item.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            campusId: mockAdminUser.campusId,
            category: ItemCategory.ELECTRONICS,
          }),
        }),
      );
    });
  });

  describe('FR-33: Storage Locations Management', () => {
    it('getStorageLocations lists locations for current campus', async () => {
      prismaMock.storageLocation.findMany.mockResolvedValue([
        { id: 'loc-1', name: StorageLocationName.SECURITY_OFFICE, campusId: mockAdminUser.campusId },
      ]);

      const locations = await adminService.getStorageLocations(mockAdminUser);
      expect(locations.length).toBe(1);
      expect(prismaMock.storageLocation.findMany).toHaveBeenCalledWith({
        where: { campusId: mockAdminUser.campusId },
        include: { _count: { select: { items: true } } },
        orderBy: { name: 'asc' },
      });
    });

    it('createStorageLocation creates new location and writes audit log (INT-8)', async () => {
      prismaMock.storageLocation.findUnique.mockResolvedValue(null);
      prismaMock.storageLocation.create.mockResolvedValue({
        id: 'loc-1',
        name: StorageLocationName.LIBRARY,
        campusId: mockAdminUser.campusId,
      });

      const res = await adminService.createStorageLocation(mockAdminUser, {
        name: StorageLocationName.LIBRARY,
      });

      expect(res.name).toBe(StorageLocationName.LIBRARY);
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          actorId: mockAdminUser.id,
          action: 'STORAGE_LOCATION_CREATED',
          targetType: 'StorageLocation',
        }),
      });
    });

    it('createStorageLocation throws ConflictException if already exists in campus', async () => {
      prismaMock.storageLocation.findUnique.mockResolvedValue({
        id: 'existing-loc',
        name: StorageLocationName.LIBRARY,
        campusId: mockAdminUser.campusId,
      });

      await expect(
        adminService.createStorageLocation(mockAdminUser, {
          name: StorageLocationName.LIBRARY,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('updateStorageLocation throws ForbiddenException if location is in different campus (INT-6)', async () => {
      prismaMock.storageLocation.findUnique.mockResolvedValue({
        id: 'other-loc',
        campusId: 'other-campus-uuid',
        name: StorageLocationName.LABORATORY,
      });

      await expect(
        adminService.updateStorageLocation(mockAdminUser, 'other-loc', {
          name: StorageLocationName.RECEPTION,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('FR-34: Analytics Calculation From Source Data', () => {
    it('computes accurate metrics, recovery rate, breakdowns and hotspots', async () => {
      // Setup counts
      prismaMock.item.count
        .mockResolvedValueOnce(20) // totalReported
        .mockResolvedValueOnce(5)  // totalLost
        .mockResolvedValueOnce(15) // totalFound
        .mockResolvedValueOnce(12) // totalReturned
        .mockResolvedValueOnce(2)  // totalReadyForCollection
        .mockResolvedValueOnce(1)  // totalArchived
        .mockResolvedValueOnce(0); // totalUnclaimed

      prismaMock.claim.count
        .mockResolvedValueOnce(3) // pendingClaims
        .mockResolvedValueOnce(2); // activeHolds

      prismaMock.item.groupBy
        .mockResolvedValueOnce([
          { category: ItemCategory.ELECTRONICS, _count: { _all: 10 } },
          { category: ItemCategory.WALLETS, _count: { _all: 5 } },
        ])
        .mockResolvedValueOnce([
          { foundLocation: 'Library 1st floor', _count: { _all: 8 } },
        ])
        .mockResolvedValueOnce([
          { lastKnownLocation: 'Canteen', _count: { _all: 4 } },
        ]);

      const analytics = await adminService.getAnalytics(mockAdminUser);

      expect(analytics.metrics.totalReported).toBe(20);
      expect(analytics.metrics.totalLost).toBe(5);
      expect(analytics.metrics.totalFound).toBe(15);
      expect(analytics.metrics.totalReturned).toBe(12);
      // recoveryRate = (12 / 15) * 100 = 80.00%
      expect(analytics.metrics.recoveryRate).toBe(80.0);
      expect(analytics.metrics.pendingClaims).toBe(3);
      expect(analytics.metrics.activeHolds).toBe(2);

      expect(analytics.categoryBreakdown[ItemCategory.ELECTRONICS]).toBe(10);
      expect(analytics.categoryBreakdown[ItemCategory.WALLETS]).toBe(5);
      expect(analytics.hotspots.found[0].location).toBe('Library 1st floor');
      expect(analytics.hotspots.lost[0].location).toBe('Canteen');
    });
  });

  describe('FR-37, INT-8, INV-DM-8: Append-Only Audit Trail Queries', () => {
    it('record writes an append-only audit entry', async () => {
      prismaMock.auditLog.create.mockResolvedValue({
        id: 'audit-1',
        action: 'ITEM_STATUS_ADVANCE',
      });

      const entry = await auditService.record({
        actorId: mockAdminUser.id,
        action: 'ITEM_STATUS_ADVANCE',
        targetType: 'Item',
        targetId: 'item-1',
        before: { status: ItemStatus.FOUND },
        after: { status: ItemStatus.READY_FOR_COLLECTION },
      });

      expect(entry).toBeDefined();
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          actorId: mockAdminUser.id,
          action: 'ITEM_STATUS_ADVANCE',
          targetType: 'Item',
          targetId: 'item-1',
        }),
      });
    });

    it('getAuditLogs filters and paginates chronologically', async () => {
      prismaMock.auditLog.count.mockResolvedValue(1);
      prismaMock.auditLog.findMany.mockResolvedValue([
        {
          id: 'audit-1',
          action: 'CLAIM_APPROVED',
          targetType: 'Claim',
          targetId: 'claim-1',
          createdAt: new Date('2026-10-16T12:00:00Z'),
          actor: { name: 'Admin', email: 'admin@gsfc.edu' },
        },
      ]);

      const result = await auditService.getAuditLogs(mockAdminUser, {
        action: 'CLAIM_APPROVED',
        page: 1,
        limit: 20,
      });

      expect(result.total).toBe(1);
      expect(result.logs.length).toBe(1);
      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ action: 'CLAIM_APPROVED' }),
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });
});
