import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ItemsService } from '../src/modules/items/items.service';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { TenancyService } from '../src/modules/tenancy/tenancy.service';
import { ItemCategory, ItemStatus, ItemType, Role } from '../src/domain/enums';
import { AuthUser } from '../src/common/interfaces/auth-user.interface';

describe('ItemsService (Phase 2: FR-6..9, FR-28, INV-DM-1, INV-DM-6)', () => {
  let service: ItemsService;
  let prisma: any;
  let tenancyService: any;

  const mockUser: AuthUser = {
    id: 'user-1',
    email: 'reporter@gsfcuniversity.ac.in',
    role: Role.STUDENT,
    campusId: 'campus-1',
    departmentId: 'dept-1',
  };

  const otherUser: AuthUser = {
    id: 'user-2',
    email: 'other@gsfcuniversity.ac.in',
    role: Role.STUDENT,
    campusId: 'campus-1',
  };

  const adminUser: AuthUser = {
    id: 'admin-1',
    email: 'admin@gsfcuniversity.ac.in',
    role: Role.ADMIN,
    campusId: 'campus-1',
  };

  beforeEach(async () => {
    prisma = {
      item: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      storageLocation: {
        findFirst: jest.fn(),
      },
      caseMessage: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      },
    };

    tenancyService = {
      assertCampusAccess: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemsService,
        { provide: PrismaService, useValue: prisma },
        { provide: TenancyService, useValue: tenancyService },
      ],
    }).compile();

    service = module.get<ItemsService>(ItemsService);
  });

  describe('INV-DM-1: Case ID Generation', () => {
    it('generates a unique case ID in CIRS-YYYY-XXXXXX format', async () => {
      prisma.item.findUnique.mockResolvedValue(null);
      const caseId = await service.generateCaseId();

      const year = new Date().getFullYear();
      expect(caseId).toMatch(new RegExp(`^CIRS-${year}-\\w+$`));
    });
  });

  describe('FR-6, INV-DM-6: Reporting Lost Item', () => {
    it('creates a lost report with status LOST_REPORTED and requires dateLost', async () => {
      prisma.item.findUnique.mockResolvedValue(null);
      prisma.item.create.mockImplementation(({ data }: any) =>
        Promise.resolve({
          id: 'item-1',
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      const dto = {
        type: ItemType.LOST,
        itemName: 'Blue Umbrella',
        category: ItemCategory.OTHERS,
        description: 'Navy blue folding umbrella',
        colour: 'Blue',
        brand: 'Generic',
        identifyingMarks: 'Small tear on handle',
        dateLost: '2026-10-15T10:00:00.000Z',
        lastKnownLocation: 'Library 1st floor',
      };

      const result = await service.createItem(mockUser, dto);

      expect(result.caseId).toBeDefined();
      expect(result.status).toBe(ItemStatus.LOST_REPORTED);
      expect(result.type).toBe(ItemType.LOST);
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'ITEM_REPORTED' }),
        }),
      );
    });

    it('rejects a LOST report if dateLost is missing (INV-DM-6)', async () => {
      const dto = {
        type: ItemType.LOST,
        itemName: 'Lost Wallet',
        category: ItemCategory.WALLETS,
        description: 'Leather wallet',
        colour: 'Black',
        brand: 'Titan',
        identifyingMarks: 'Initials JD',
      };

      await expect(service.createItem(mockUser, dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects a LOST report if storageLocationId is passed (INV-DM-6)', async () => {
      const dto = {
        type: ItemType.LOST,
        itemName: 'Lost Watch',
        category: ItemCategory.ACCESSORIES,
        description: 'Wristwatch',
        colour: 'Silver',
        brand: 'Casio',
        identifyingMarks: 'Steel band',
        dateLost: '2026-10-15T10:00:00.000Z',
        storageLocationId: 'storage-1',
      };

      await expect(service.createItem(mockUser, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('FR-7, INV-DM-6: Reporting Found Item', () => {
    it('creates a found report with status FOUND and requires storage location in user campus', async () => {
      prisma.item.findUnique.mockResolvedValue(null);
      prisma.storageLocation.findFirst.mockResolvedValue({
        id: 'loc-1',
        campusId: 'campus-1',
        name: 'SECURITY_OFFICE',
      });
      prisma.item.create.mockImplementation(({ data }: any) =>
        Promise.resolve({
          id: 'item-2',
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      const dto = {
        type: ItemType.FOUND,
        itemName: 'Keys',
        category: ItemCategory.KEYS,
        description: 'Bunch of keys with red tag',
        colour: 'Silver',
        brand: 'Godrej',
        identifyingMarks: 'Red keychain',
        dateFound: '2026-10-15T12:00:00.000Z',
        foundLocation: 'Auditorium',
        storageLocationId: 'loc-1',
      };

      const result = await service.createItem(mockUser, dto);

      expect(result.status).toBe(ItemStatus.FOUND);
      expect(result.type).toBe(ItemType.FOUND);
      expect(result.storageLocationId).toBe('loc-1');
    });

    it('rejects a FOUND report if dateFound or storageLocationId is missing (INV-DM-6)', async () => {
      const dtoWithoutDate = {
        type: ItemType.FOUND,
        itemName: 'Found Laptop',
        category: ItemCategory.ELECTRONICS,
        description: 'ThinkPad',
        colour: 'Black',
        brand: 'Lenovo',
        identifyingMarks: 'Stickers on lid',
        storageLocationId: 'loc-1',
      };

      await expect(service.createItem(mockUser, dtoWithoutDate as any)).rejects.toThrow(
        BadRequestException,
      );

      const dtoWithoutStorage = {
        type: ItemType.FOUND,
        itemName: 'Found Laptop',
        category: ItemCategory.ELECTRONICS,
        description: 'ThinkPad',
        colour: 'Black',
        brand: 'Lenovo',
        identifyingMarks: 'Stickers on lid',
        dateFound: '2026-10-15T12:00:00.000Z',
      };

      await expect(
        service.createItem(mockUser, dtoWithoutStorage as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a FOUND report if storageLocation does not exist in user campus', async () => {
      prisma.storageLocation.findFirst.mockResolvedValue(null);

      const dto = {
        type: ItemType.FOUND,
        itemName: 'Found Bag',
        category: ItemCategory.BAGS,
        description: 'Backpack',
        colour: 'Black',
        brand: 'Wildcraft',
        identifyingMarks: 'Blue zip',
        dateFound: '2026-10-15T12:00:00.000Z',
        storageLocationId: 'loc-other-campus',
      };

      await expect(service.createItem(mockUser, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('FR-9: Edit Own Report', () => {
    it('allows owner to edit report in pre-claim state', async () => {
      prisma.item.findUnique.mockResolvedValue({
        id: 'item-1',
        caseId: 'CIRS-2026-000001',
        reporterId: 'user-1',
        campusId: 'campus-1',
        status: ItemStatus.LOST_REPORTED,
        itemName: 'Old Name',
        claims: [],
      });

      prisma.item.update.mockResolvedValue({
        id: 'item-1',
        caseId: 'CIRS-2026-000001',
        itemName: 'Updated Umbrella',
        category: ItemCategory.OTHERS,
      });

      const updated = await service.editItem(mockUser, 'CIRS-2026-000001', {
        itemName: 'Updated Umbrella',
      });

      expect(updated.itemName).toBe('Updated Umbrella');
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'ITEM_UPDATED' }),
        }),
      );
    });

    it('rejects edit if requester is not the owner (FR-9)', async () => {
      prisma.item.findUnique.mockResolvedValue({
        id: 'item-1',
        caseId: 'CIRS-2026-000001',
        reporterId: 'user-1',
        campusId: 'campus-1',
        status: ItemStatus.LOST_REPORTED,
        claims: [],
      });

      await expect(
        service.editItem(otherUser, 'CIRS-2026-000001', { itemName: 'Hacked' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects edit if case has an approved claim or advanced status (FR-9)', async () => {
      prisma.item.findUnique.mockResolvedValue({
        id: 'item-1',
        caseId: 'CIRS-2026-000001',
        reporterId: 'user-1',
        campusId: 'campus-1',
        status: ItemStatus.READY_FOR_COLLECTION,
        claims: [{ id: 'claim-1', status: 'APPROVED' }],
      });

      await expect(
        service.editItem(mockUser, 'CIRS-2026-000001', { itemName: 'Attempt' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('FR-28: Cancel Own Case', () => {
    it('allows owner to cancel and archive own case', async () => {
      prisma.item.findUnique.mockResolvedValue({
        id: 'item-1',
        caseId: 'CIRS-2026-000001',
        reporterId: 'user-1',
        campusId: 'campus-1',
        status: ItemStatus.LOST_REPORTED,
      });

      prisma.item.update.mockResolvedValue({
        id: 'item-1',
        caseId: 'CIRS-2026-000001',
        status: ItemStatus.ARCHIVED,
      });

      const res = await service.cancelItem(mockUser, 'CIRS-2026-000001');

      expect(res.status).toBe(ItemStatus.ARCHIVED);
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'ITEM_CANCELLED' }),
        }),
      );
    });

    it('rejects cancel attempt by non-owner', async () => {
      prisma.item.findUnique.mockResolvedValue({
        id: 'item-1',
        caseId: 'CIRS-2026-000001',
        reporterId: 'user-1',
        campusId: 'campus-1',
        status: ItemStatus.LOST_REPORTED,
      });

      await expect(service.cancelItem(otherUser, 'CIRS-2026-000001')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('FR-12, INT-5: Fetch Item with Privacy Masking', () => {
    it('returns privacy-masked data for non-owner public access', async () => {
      prisma.item.findUnique.mockResolvedValue({
        id: 'item-1',
        caseId: 'CIRS-2026-000001',
        type: ItemType.FOUND,
        reporterId: 'user-1',
        campusId: 'campus-1',
        itemName: 'Found iPhone',
        category: ItemCategory.ELECTRONICS,
        description: 'Black iPhone in case',
        colour: 'Black',
        brand: 'Apple',
        identifyingMarks: 'Lock screen photo',
        status: ItemStatus.FOUND,
        images: [{ url: '/uploads/iphone.jpg' }],
        reporter: {
          id: 'user-1',
          name: 'Jane Finder',
          email: 'jane@gsfcuniversity.ac.in',
        },
      });

      const result: any = await service.getItemByCaseId(otherUser, 'CIRS-2026-000001');

      // Assert allowlist serialization masks reporter details
      expect(result.caseId).toBe('CIRS-2026-000001');
      expect(result.itemName).toBe('Found iPhone');
      expect(result.reporter).toBeUndefined();
      expect(result.reporterId).toBeUndefined();
    });

    it('returns full data for owner', async () => {
      const fullItem = {
        id: 'item-1',
        caseId: 'CIRS-2026-000001',
        type: ItemType.FOUND,
        reporterId: 'user-1',
        campusId: 'campus-1',
        itemName: 'Found iPhone',
        category: ItemCategory.ELECTRONICS,
        description: 'Black iPhone in case',
        colour: 'Black',
        brand: 'Apple',
        identifyingMarks: 'Lock screen photo',
        status: ItemStatus.FOUND,
        images: [{ url: '/uploads/iphone.jpg' }],
        reporter: {
          id: 'user-1',
          name: 'Jane Finder',
          email: 'jane@gsfcuniversity.ac.in',
        },
      };
      prisma.item.findUnique.mockResolvedValue(fullItem);

      const result: any = await service.getItemByCaseId(mockUser, 'CIRS-2026-000001');
      expect(result.reporter).toBeDefined();
    });
  });

  describe('FR-32: Staff-Mediated Case Messaging', () => {
    it('adds case message with authenticated user as sender', async () => {
      prisma.item.findUnique.mockResolvedValue({
        id: 'item-1',
        caseId: 'CIRS-2026-000001',
        campusId: 'campus-1',
      });

      prisma.caseMessage.create.mockResolvedValue({
        id: 'msg-1',
        itemId: 'item-1',
        senderId: 'user-1',
        body: 'Where was this found?',
      });

      const res = await service.addCaseMessage(
        mockUser,
        'CIRS-2026-000001',
        'Where was this found?',
      );

      expect(res.id).toBe('msg-1');
      expect(prisma.caseMessage.create).toHaveBeenCalledWith({
        data: {
          itemId: 'item-1',
          senderId: 'user-1',
          body: 'Where was this found?',
          visibleToStaff: true,
        },
        include: expect.any(Object),
      });
    });

    it('restricts reading case messages to owner and admin', async () => {
      prisma.item.findUnique.mockResolvedValue({
        id: 'item-1',
        caseId: 'CIRS-2026-000001',
        reporterId: 'user-1',
        campusId: 'campus-1',
      });

      // Other non-admin user cannot read messages
      await expect(
        service.getCaseMessages(otherUser, 'CIRS-2026-000001'),
      ).rejects.toThrow(ForbiddenException);

      // Owner can read messages
      prisma.caseMessage.findMany.mockResolvedValue([]);
      await expect(
        service.getCaseMessages(mockUser, 'CIRS-2026-000001'),
      ).resolves.toEqual([]);

      // Admin can read messages
      await expect(
        service.getCaseMessages(adminUser, 'CIRS-2026-000001'),
      ).resolves.toEqual([]);
    });
  });
});
