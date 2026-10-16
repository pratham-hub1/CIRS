import { Test, TestingModule } from '@nestjs/testing';
import { MatchingService, MATCH_THRESHOLD } from '../src/modules/matching/matching.service';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { TenancyService } from '../src/modules/tenancy/tenancy.service';
import { NotificationsService } from '../src/modules/notifications/notifications.service';
import { ItemCategory, ItemType, MatchStatus, NotificationType, Role } from '../src/domain/enums';
import { AuthUser } from '../src/common/interfaces/auth-user.interface';

describe('MatchingService (Phase 4: WF-3, INT-2, INT-12, INV-DM-9)', () => {
  let service: MatchingService;
  let prisma: any;
  let tenancyService: any;
  let notificationsService: any;

  const mockAdmin: AuthUser = {
    id: 'admin-1',
    email: 'security@gsfcuniversity.ac.in',
    role: Role.ADMIN,
    campusId: 'campus-1',
  };

  beforeEach(async () => {
    prisma = {
      item: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      match: {
        upsert: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      savedSearch: {
        findMany: jest.fn(),
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
        MatchingService,
        { provide: PrismaService, useValue: prisma },
        { provide: TenancyService, useValue: tenancyService },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get<MatchingService>(MatchingService);
  });

  describe('INT-2: Report-to-Match-to-Notify Composition', () => {
    it('computes matches for opposite item type, upserts match, and notifies both sides', async () => {
      const lostItem = {
        id: 'lost-1',
        caseId: 'CIRS-2026-000001',
        type: ItemType.LOST,
        campusId: 'campus-1',
        reporterId: 'user-lost',
        category: ItemCategory.ELECTRONICS,
        itemName: 'Dell XPS 13',
        description: 'Silver laptop with carbon interior',
        colour: 'Silver',
        brand: 'Dell',
        identifyingMarks: 'Sticker',
        dateLost: new Date('2026-10-10'),
      };

      const foundCandidate = {
        id: 'found-1',
        caseId: 'CIRS-2026-000002',
        type: ItemType.FOUND,
        campusId: 'campus-1',
        reporterId: 'user-found',
        category: ItemCategory.ELECTRONICS,
        itemName: 'Dell XPS Laptop',
        description: 'Silver Dell laptop found in classroom',
        colour: 'Silver',
        brand: 'Dell',
        identifyingMarks: 'Sticker',
        dateFound: new Date('2026-10-11'),
      };

      prisma.item.findMany.mockResolvedValue([foundCandidate]);
      prisma.savedSearch.findMany.mockResolvedValue([]);
      prisma.match.upsert.mockResolvedValue({
        id: 'match-1',
        lostItemId: 'lost-1',
        foundItemId: 'found-1',
        score: 0.85,
        status: MatchStatus.SUGGESTED,
      });

      const matches = await service.runMatchingForItem(lostItem);

      expect(matches.length).toBe(1);
      // Assert upsert used with composite unique key (INV-DM-9)
      expect(prisma.match.upsert).toHaveBeenCalledWith({
        where: {
          lostItemId_foundItemId: {
            lostItemId: 'lost-1',
            foundItemId: 'found-1',
          },
        },
        create: expect.objectContaining({
          lostItemId: 'lost-1',
          foundItemId: 'found-1',
          status: MatchStatus.SUGGESTED,
        }),
        update: expect.any(Object),
      });

      // Assert notifications sent to both sides (INT-2)
      expect(notificationsService.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-lost',
          type: NotificationType.POSSIBLE_MATCH,
          eventKey: 'POSSIBLE_MATCH:lost-1:found-1:user-lost',
        }),
      );

      expect(notificationsService.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-found',
          type: NotificationType.POSSIBLE_MATCH,
          eventKey: 'POSSIBLE_MATCH:lost-1:found-1:user-found',
        }),
      );
    });
  });

  describe('INT-12: Saved-Search Alert Correctness', () => {
    it('notifies watcher with deterministic key when new item matches saved search criteria', async () => {
      const activeWatch = {
        id: 'watch-1',
        userId: 'watcher-1',
        name: 'iPhone Watch',
        criteria: { category: ItemCategory.ELECTRONICS, q: 'iphone' },
      };

      prisma.savedSearch.findMany.mockResolvedValue([activeWatch]);

      const newItem = {
        id: 'item-new',
        caseId: 'CIRS-2026-000003',
        campusId: 'campus-1',
        category: ItemCategory.ELECTRONICS,
        itemName: 'iPhone 13 Pro',
      };

      await service.evaluateSavedSearches(newItem);

      expect(notificationsService.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'watcher-1',
          type: NotificationType.POSSIBLE_MATCH,
          eventKey: 'SAVED_SEARCH:watch-1:item-new',
        }),
      );
    });

    it('does not notify watcher when criteria does not match', async () => {
      const activeWatch = {
        id: 'watch-1',
        userId: 'watcher-1',
        name: 'Wallet Watch',
        criteria: { category: ItemCategory.WALLETS },
      };

      prisma.savedSearch.findMany.mockResolvedValue([activeWatch]);

      const newItem = {
        id: 'item-new',
        caseId: 'CIRS-2026-000004',
        campusId: 'campus-1',
        category: ItemCategory.ELECTRONICS, // Mismatched category
        itemName: 'iPhone',
      };

      await service.evaluateSavedSearches(newItem);

      expect(notificationsService.notify).not.toHaveBeenCalled();
    });
  });

  describe('Staff Match Actions', () => {
    it('staff confirms a match', async () => {
      prisma.match.findUnique.mockResolvedValue({ id: 'match-1' });
      prisma.match.update.mockResolvedValue({
        id: 'match-1',
        status: MatchStatus.CONFIRMED,
      });

      const res = await service.confirmMatch(mockAdmin, 'match-1');
      expect(res.status).toBe(MatchStatus.CONFIRMED);
    });

    it('staff dismisses a match', async () => {
      prisma.match.findUnique.mockResolvedValue({ id: 'match-1' });
      prisma.match.update.mockResolvedValue({
        id: 'match-1',
        status: MatchStatus.DISMISSED,
      });

      const res = await service.dismissMatch(mockAdmin, 'match-1');
      expect(res.status).toBe(MatchStatus.DISMISSED);
    });
  });
});
