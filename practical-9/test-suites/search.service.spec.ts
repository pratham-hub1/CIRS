import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SearchService } from '../src/modules/search/search.service';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { TenancyService } from '../src/modules/tenancy/tenancy.service';
import { ItemCategory, ItemStatus, ItemType, Role } from '../src/domain/enums';
import { AuthUser } from '../src/common/interfaces/auth-user.interface';

describe('SearchService (Phase 3: FR-10..13, INT-5)', () => {
  let service: SearchService;
  let prisma: any;
  let tenancyService: any;

  const mockUser: AuthUser = {
    id: 'user-1',
    email: 'user@gsfcuniversity.ac.in',
    role: Role.STUDENT,
    campusId: 'campus-1',
  };

  const otherUser: AuthUser = {
    id: 'user-2',
    email: 'other@gsfcuniversity.ac.in',
    role: Role.STUDENT,
    campusId: 'campus-1',
  };

  beforeEach(async () => {
    prisma = {
      item: {
        findMany: jest.fn(),
      },
      savedSearch: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
    };

    tenancyService = {
      assertCampusAccess: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: prisma },
        { provide: TenancyService, useValue: tenancyService },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  describe('FR-12, INT-5: Community Feed', () => {
    it('returns privacy-masked items excluding archived records', async () => {
      const dbItems = [
        {
          id: 'item-1',
          caseId: 'CIRS-2026-000001',
          type: ItemType.FOUND,
          reporterId: 'user-secret',
          campusId: 'campus-1',
          itemName: 'Black Wallet',
          category: ItemCategory.WALLETS,
          description: 'Leather wallet',
          colour: 'Black',
          brand: 'Woodland',
          identifyingMarks: 'Card with name John',
          status: ItemStatus.FOUND,
          images: [{ url: '/uploads/wallet.jpg' }],
          createdAt: new Date(),
          // Sensitive data that must NOT leak:
          phone: '+919999999999',
          email: 'john@secret.com',
          studentId: 'STU12345',
        },
      ];

      prisma.item.findMany.mockResolvedValue(dbItems);

      const feed = await service.getCommunityFeed(mockUser, { limit: 10 });

      expect(feed.data.length).toBe(1);
      const item = feed.data[0] as any;
      expect(item.caseId).toBe('CIRS-2026-000001');
      expect(item.itemName).toBe('Black Wallet');
      expect(item.phone).toBeUndefined();
      expect(item.email).toBeUndefined();
      expect(item.studentId).toBeUndefined();
      expect(item.reporterId).toBeUndefined();

      expect(prisma.item.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            campusId: 'campus-1',
            archivedAt: null,
          }),
        }),
      );
    });
  });

  describe('FR-10, FR-11: Search and Multi-filter', () => {
    it('combines text search and filters with server-side AND logic', async () => {
      prisma.item.findMany.mockResolvedValue([]);

      await service.searchItems(mockUser, {
        q: 'Calculator',
        category: ItemCategory.ELECTRONICS,
        startDate: '2026-10-01T00:00:00.000Z',
        endDate: '2026-10-15T00:00:00.000Z',
        location: 'Lab 3',
        limit: 20,
      });

      expect(prisma.item.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            campusId: 'campus-1',
            category: ItemCategory.ELECTRONICS,
            OR: expect.arrayContaining([
              { itemName: { contains: 'Calculator', mode: 'insensitive' } },
            ]),
          }),
        }),
      );
    });
  });

  describe('FR-13: Saved Searches / Watch Alerts', () => {
    it('creates a saved search for the user', async () => {
      prisma.savedSearch.create.mockResolvedValue({
        id: 'watch-1',
        userId: 'user-1',
        name: 'My Watch',
        criteria: { category: 'ELECTRONICS' },
        active: true,
      });

      const res = await service.createSavedSearch(mockUser, {
        name: 'My Watch',
        criteria: { category: 'ELECTRONICS' },
      });

      expect(res.id).toBe('watch-1');
      expect(prisma.savedSearch.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          name: 'My Watch',
          criteria: { category: 'ELECTRONICS' },
          active: true,
        },
      });
    });

    it('lists saved searches for user', async () => {
      prisma.savedSearch.findMany.mockResolvedValue([
        { id: 'watch-1', name: 'Watch 1' },
      ]);

      const res = await service.getSavedSearches(mockUser);
      expect(res.length).toBe(1);
    });

    it('allows owner to delete saved search', async () => {
      prisma.savedSearch.findUnique.mockResolvedValue({
        id: 'watch-1',
        userId: 'user-1',
      });
      prisma.savedSearch.delete.mockResolvedValue({ id: 'watch-1' });

      const res = await service.deleteSavedSearch(mockUser, 'watch-1');
      expect(res.message).toBe('Watch removed successfully');
      expect(prisma.savedSearch.delete).toHaveBeenCalledWith({
        where: { id: 'watch-1' },
      });
    });

    it('forbids deleting another user saved search', async () => {
      prisma.savedSearch.findUnique.mockResolvedValue({
        id: 'watch-1',
        userId: 'user-1',
      });

      await expect(
        service.deleteSavedSearch(otherUser, 'watch-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
