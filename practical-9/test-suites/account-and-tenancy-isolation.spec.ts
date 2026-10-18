import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import {
  Role,
  UserStatus,
  ItemStatus,
  ItemType,
  ItemCategory,
  ClaimStatus,
  NotificationType,
} from '../src/domain/enums';
import { applyCampusScope } from '../src/common/repositories/scoped.repository';

describe('Account & Tenancy Isolation Verification (Issue 4)', () => {
  let app: NestFastifyApplication;
  let jwtService: JwtService;

  // In-memory data store for testing isolation guarantees
  const usersDb = new Map<string, any>();
  const itemsDb = new Map<string, any>();
  const claimsDb = new Map<string, any>();
  const notificationsDb = new Map<string, any>();
  const savedSearchesDb = new Map<string, any>();
  const storageLocationsDb = new Map<string, any>();
  const caseMessagesDb = new Map<string, any>();
  const auditLogsDb: any[] = [];

  // Tokens
  let tokenUserA: string; // Campus 1 (GSFC-Main)
  let tokenUserB: string; // Campus 1 (GSFC-Main) - different user in same campus
  let tokenUserC: string; // Campus 2 (GSFC-Other) - user in different campus
  let tokenAdminCampus1: string; // Admin in Campus 1
  let tokenAdminCampus2: string; // Admin in Campus 2

  beforeAll(async () => {
    // Seed in-memory storage locations
    storageLocationsDb.set('loc-campus-1', {
      id: 'loc-campus-1',
      campusId: 'campus-1',
      name: 'SECURITY_OFFICE',
      createdAt: new Date(),
    });
    storageLocationsDb.set('loc-campus-2', {
      id: 'loc-campus-2',
      campusId: 'campus-2',
      name: 'SECURITY_OFFICE',
      createdAt: new Date(),
    });

    // Seed in-memory users
    usersDb.set('user-A', {
      id: 'user-A',
      name: 'Student User A',
      email: 'student.a@gsfcuniversity.ac.in',
      role: Role.STUDENT,
      campusId: 'campus-1',
      departmentId: 'dept-cse',
      status: UserStatus.ACTIVE,
    });
    usersDb.set('user-B', {
      id: 'user-B',
      name: 'Student User B',
      email: 'student.b@gsfcuniversity.ac.in',
      role: Role.STUDENT,
      campusId: 'campus-1',
      departmentId: 'dept-cse',
      status: UserStatus.ACTIVE,
    });
    usersDb.set('user-C', {
      id: 'user-C',
      name: 'Student User C (Campus 2)',
      email: 'student.c@gsfcuniversity.ac.in',
      role: Role.STUDENT,
      campusId: 'campus-2',
      departmentId: 'dept-me',
      status: UserStatus.ACTIVE,
    });
    usersDb.set('admin-1', {
      id: 'admin-1',
      name: 'Campus 1 Admin',
      email: 'admin.c1@gsfcuniversity.ac.in',
      role: Role.ADMIN,
      campusId: 'campus-1',
      departmentId: 'dept-cse',
      status: UserStatus.ACTIVE,
    });
    usersDb.set('admin-2', {
      id: 'admin-2',
      name: 'Campus 2 Admin',
      email: 'admin.c2@gsfcuniversity.ac.in',
      role: Role.ADMIN,
      campusId: 'campus-2',
      departmentId: 'dept-me',
      status: UserStatus.ACTIVE,
    });

    // Seed items
    // Item 1: Reported FOUND by User A in Campus 1
    itemsDb.set('item-A1', {
      id: 'item-A1',
      caseId: 'CIRS-2026-100001',
      type: ItemType.FOUND,
      reporterId: 'user-A',
      campusId: 'campus-1',
      departmentId: 'dept-cse',
      itemName: "User A's Found Laptop",
      category: ItemCategory.ELECTRONICS,
      description: 'Found in computer lab',
      colour: 'Silver',
      brand: 'Dell',
      identifyingMarks: 'University sticker on lid',
      serialNumber: 'SN-DELL-SECRET-999',
      status: ItemStatus.FOUND,
      dateFound: new Date(),
      foundLocation: 'Lab 3',
      storageLocationId: 'loc-campus-1',
      images: [],
      createdAt: new Date(),
    });

    // Item 2: Reported LOST by User B in Campus 1
    itemsDb.set('item-B1', {
      id: 'item-B1',
      caseId: 'CIRS-2026-100002',
      type: ItemType.LOST,
      reporterId: 'user-B',
      campusId: 'campus-1',
      departmentId: 'dept-cse',
      itemName: "User B's Lost Headphones",
      category: ItemCategory.ELECTRONICS,
      description: 'Black Sony headphones',
      colour: 'Black',
      brand: 'Sony',
      identifyingMarks: 'Scratch on left cup',
      serialNumber: 'SN-SONY-SECRET-888',
      status: ItemStatus.LOST_REPORTED,
      dateLost: new Date(),
      lastKnownLocation: 'Library 1st floor',
      storageLocationId: null,
      images: [],
      createdAt: new Date(),
    });

    // Item 3: Reported FOUND by User C in Campus 2
    itemsDb.set('item-C1', {
      id: 'item-C1',
      caseId: 'CIRS-2026-200001',
      type: ItemType.FOUND,
      reporterId: 'user-C',
      campusId: 'campus-2',
      departmentId: 'dept-me',
      itemName: "User C's Found Calculator (Campus 2)",
      category: ItemCategory.ELECTRONICS,
      description: 'Casio fx-991EX',
      colour: 'Black',
      brand: 'Casio',
      identifyingMarks: 'Initials ME carved on back',
      serialNumber: 'SN-CASIO-SECRET-777',
      status: ItemStatus.FOUND,
      dateFound: new Date(),
      foundLocation: 'Workshop B',
      storageLocationId: 'loc-campus-2',
      images: [],
      createdAt: new Date(),
    });

    // Seed Claims
    // User B submits claim on Item A1 (Found in Campus 1)
    claimsDb.set('claim-B-on-A1', {
      id: 'claim-B-on-A1',
      itemId: 'item-A1',
      itemType: ItemType.FOUND,
      claimantId: 'user-B',
      description: 'This is my Dell laptop',
      colour: 'Silver',
      brand: 'Dell',
      identifyingMarks: 'Sticker matches my sticker',
      verificationLevel: 'HIGH',
      status: ClaimStatus.PENDING,
      questions: [],
      documents: [],
      appeals: [],
      createdAt: new Date(),
    });

    // Seed Notifications
    notificationsDb.set('notif-A', {
      id: 'notif-A',
      userId: 'user-A',
      type: NotificationType.REPORT_SUBMITTED,
      message: 'Private alert for User A',
      channel: 'IN_APP',
      readAt: null,
      createdAt: new Date(),
    });
    notificationsDb.set('notif-B', {
      id: 'notif-B',
      userId: 'user-B',
      type: NotificationType.REPORT_SUBMITTED,
      message: 'Private alert for User B',
      channel: 'IN_APP',
      readAt: null,
      createdAt: new Date(),
    });

    // Seed Saved Searches
    savedSearchesDb.set('search-A', {
      id: 'search-A',
      userId: 'user-A',
      name: "User A's Watch",
      criteria: { category: 'ELECTRONICS' },
      active: true,
      createdAt: new Date(),
    });
    savedSearchesDb.set('search-B', {
      id: 'search-B',
      userId: 'user-B',
      name: "User B's Watch",
      criteria: { category: 'BAGS' },
      active: true,
      createdAt: new Date(),
    });

    // Seed Case Message
    caseMessagesDb.set('msg-A1', {
      id: 'msg-A1',
      itemId: 'item-A1',
      senderId: 'user-A',
      body: 'Secret message from reporter User A to security staff',
      visibleToStaff: true,
      createdAt: new Date(),
    });

    // Mock Prisma Service implementing relational lookups and updates
    const mockPrisma = {
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
      onModuleInit: jest.fn().mockResolvedValue(undefined),
      onModuleDestroy: jest.fn().mockResolvedValue(undefined),
      user: {
        findUnique: jest.fn().mockImplementation(({ where }: any) => {
          if (where.id) return Promise.resolve(usersDb.get(where.id) || null);
          if (where.email) {
            for (const u of usersDb.values()) {
              if (u.email === where.email) return Promise.resolve(u);
            }
          }
          return Promise.resolve(null);
        }),
      },
      item: {
        findUnique: jest.fn().mockImplementation(({ where }: any) => {
          if (where.caseId) {
            for (const item of itemsDb.values()) {
              if (item.caseId === where.caseId) {
                const reporter = usersDb.get(item.reporterId);
                const storageLocation = item.storageLocationId
                  ? storageLocationsDb.get(item.storageLocationId)
                  : null;
                const claims = Array.from(claimsDb.values()).filter(
                  (c) => c.itemId === item.id,
                );
                return Promise.resolve({
                  ...item,
                  reporter: reporter
                    ? { id: reporter.id, name: reporter.name, email: reporter.email }
                    : null,
                  storageLocation,
                  claims,
                });
              }
            }
          }
          if (where.id) {
            const item = itemsDb.get(where.id);
            if (!item) return Promise.resolve(null);
            const reporter = usersDb.get(item.reporterId);
            const storageLocation = item.storageLocationId
              ? storageLocationsDb.get(item.storageLocationId)
              : null;
            const claims = Array.from(claimsDb.values()).filter(
              (c) => c.itemId === item.id,
            );
            return Promise.resolve({
              ...item,
              reporter: reporter
                ? { id: reporter.id, name: reporter.name, email: reporter.email }
                : null,
              storageLocation,
              claims,
            });
          }
          return Promise.resolve(null);
        }),
        findMany: jest.fn().mockImplementation(({ where }: any) => {
          const results: any[] = [];
          for (const item of itemsDb.values()) {
            if (where.campusId && item.campusId !== where.campusId) continue;
            if (where.reporterId && item.reporterId !== where.reporterId) continue;
            if (where.status?.in && !where.status.in.includes(item.status)) continue;
            results.push({
              ...item,
              storageLocation: item.storageLocationId
                ? storageLocationsDb.get(item.storageLocationId)
                : null,
            });
          }
          return Promise.resolve(results);
        }),
        count: jest.fn().mockImplementation(({ where }: any) => {
          let count = 0;
          for (const item of itemsDb.values()) {
            if (where.campusId && item.campusId !== where.campusId) continue;
            count++;
          }
          return Promise.resolve(count);
        }),
        update: jest.fn().mockImplementation(({ where, data }: any) => {
          const item = itemsDb.get(where.id);
          if (!item) throw new Error('Item not found');
          Object.assign(item, data);
          return Promise.resolve(item);
        }),
      },
      claim: {
        findUnique: jest.fn().mockImplementation(({ where }: any) => {
          const claim = claimsDb.get(where.id);
          if (!claim) return Promise.resolve(null);
          const item = itemsDb.get(claim.itemId);
          const claimant = usersDb.get(claim.claimantId);
          return Promise.resolve({
            ...claim,
            item: item
              ? {
                  ...item,
                  storageLocation: item.storageLocationId
                    ? storageLocationsDb.get(item.storageLocationId)
                    : null,
                }
              : null,
            claimant: claimant
              ? { id: claimant.id, name: claimant.name, email: claimant.email }
              : null,
            questions: claim.questions || [],
            documents: claim.documents || [],
            appeals: claim.appeals || [],
          });
        }),
        findMany: jest.fn().mockImplementation(({ where }: any) => {
          const results: any[] = [];
          for (const claim of claimsDb.values()) {
            if (where.claimantId && claim.claimantId !== where.claimantId) continue;
            if (where.item?.campusId) {
              const item = itemsDb.get(claim.itemId);
              if (!item || item.campusId !== where.item.campusId) continue;
            }
            results.push({
              ...claim,
              item: itemsDb.get(claim.itemId),
            });
          }
          return Promise.resolve(results);
        }),
        findFirst: jest.fn().mockImplementation(({ where }: any) => {
          for (const claim of claimsDb.values()) {
            if (where.itemId && claim.itemId !== where.itemId) continue;
            if (where.claimantId && claim.claimantId !== where.claimantId) continue;
            return Promise.resolve(claim);
          }
          return Promise.resolve(null);
        }),
        update: jest.fn().mockImplementation(({ where, data }: any) => {
          const claim = claimsDb.get(where.id);
          if (!claim) throw new Error('Claim not found');
          Object.assign(claim, data);
          return Promise.resolve(claim);
        }),
      },
      notification: {
        findUnique: jest.fn().mockImplementation(({ where }: any) => {
          return Promise.resolve(notificationsDb.get(where.id) || null);
        }),
        findMany: jest.fn().mockImplementation(({ where }: any) => {
          const results: any[] = [];
          for (const n of notificationsDb.values()) {
            if (where.userId && n.userId !== where.userId) continue;
            results.push(n);
          }
          return Promise.resolve(results);
        }),
        update: jest.fn().mockImplementation(({ where, data }: any) => {
          const n = notificationsDb.get(where.id);
          if (!n) throw new Error('Notification not found');
          Object.assign(n, data);
          return Promise.resolve(n);
        }),
      },
      savedSearch: {
        findUnique: jest.fn().mockImplementation(({ where }: any) => {
          return Promise.resolve(savedSearchesDb.get(where.id) || null);
        }),
        findMany: jest.fn().mockImplementation(({ where }: any) => {
          const results: any[] = [];
          for (const s of savedSearchesDb.values()) {
            if (where.userId && s.userId !== where.userId) continue;
            results.push(s);
          }
          return Promise.resolve(results);
        }),
        delete: jest.fn().mockImplementation(({ where }: any) => {
          savedSearchesDb.delete(where.id);
          return Promise.resolve({ id: where.id });
        }),
      },
      storageLocation: {
        findUnique: jest.fn().mockImplementation(({ where }: any) => {
          if (where.id) return Promise.resolve(storageLocationsDb.get(where.id) || null);
          return Promise.resolve(null);
        }),
        findFirst: jest.fn().mockImplementation(({ where }: any) => {
          for (const loc of storageLocationsDb.values()) {
            if (where.id && loc.id !== where.id) continue;
            if (where.campusId && loc.campusId !== where.campusId) continue;
            return Promise.resolve(loc);
          }
          return Promise.resolve(null);
        }),
        findMany: jest.fn().mockImplementation(({ where }: any) => {
          const results: any[] = [];
          for (const loc of storageLocationsDb.values()) {
            if (where.campusId && loc.campusId !== where.campusId) continue;
            results.push({ ...loc, _count: { items: 0 } });
          }
          return Promise.resolve(results);
        }),
      },
      caseMessage: {
        findMany: jest.fn().mockImplementation(({ where }: any) => {
          const results: any[] = [];
          for (const msg of caseMessagesDb.values()) {
            if (where.itemId && msg.itemId !== where.itemId) continue;
            results.push({
              ...msg,
              sender: usersDb.get(msg.senderId),
            });
          }
          return Promise.resolve(results);
        }),
      },
      auditLog: {
        create: jest.fn().mockImplementation(({ data }: any) => {
          const entry = { id: `audit-${auditLogsDb.length + 1}`, ...data };
          auditLogsDb.push(entry);
          return Promise.resolve(entry);
        }),
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    jwtService = moduleFixture.get<JwtService>(JwtService);

    const adapter = new FastifyAdapter({
      trustProxy: true,
      logger: false,
    });

    app = moduleFixture.createNestApplication<NestFastifyApplication>(adapter);
    app.setGlobalPrefix('api/v1', { exclude: ['health'] });

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    // Sign tokens
    tokenUserA = await jwtService.signAsync({
      sub: 'user-A',
      email: 'student.a@gsfcuniversity.ac.in',
      role: Role.STUDENT,
      campusId: 'campus-1',
      departmentId: 'dept-cse',
    });
    tokenUserB = await jwtService.signAsync({
      sub: 'user-B',
      email: 'student.b@gsfcuniversity.ac.in',
      role: Role.STUDENT,
      campusId: 'campus-1',
      departmentId: 'dept-cse',
    });
    tokenUserC = await jwtService.signAsync({
      sub: 'user-C',
      email: 'student.c@gsfcuniversity.ac.in',
      role: Role.STUDENT,
      campusId: 'campus-2',
      departmentId: 'dept-me',
    });
    tokenAdminCampus1 = await jwtService.signAsync({
      sub: 'admin-1',
      email: 'admin.c1@gsfcuniversity.ac.in',
      role: Role.ADMIN,
      campusId: 'campus-1',
      departmentId: 'dept-cse',
    });
    tokenAdminCampus2 = await jwtService.signAsync({
      sub: 'admin-2',
      email: 'admin.c2@gsfcuniversity.ac.in',
      role: Role.ADMIN,
      campusId: 'campus-2',
      departmentId: 'dept-me',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  // =========================================================================
  // 1. PER-USER ISOLATION
  // =========================================================================
  describe('1. Per-User Isolation Guarantees', () => {
    it('/items/mine returns ONLY the authenticated caller’s own reported items', async () => {
      // User A queries own items
      const resA = await app.inject({
        method: 'GET',
        url: '/api/v1/items/mine',
        headers: { authorization: `Bearer ${tokenUserA}` },
      });
      expect(resA.statusCode).toBe(200);
      const itemsA = JSON.parse(resA.payload);
      expect(itemsA.length).toBe(1);
      expect(itemsA[0].caseId).toBe('CIRS-2026-100001');
      expect(itemsA[0].reporterId).toBe('user-A');

      // User B queries own items
      const resB = await app.inject({
        method: 'GET',
        url: '/api/v1/items/mine',
        headers: { authorization: `Bearer ${tokenUserB}` },
      });
      expect(resB.statusCode).toBe(200);
      const itemsB = JSON.parse(resB.payload);
      expect(itemsB.length).toBe(1);
      expect(itemsB[0].caseId).toBe('CIRS-2026-100002');
      expect(itemsB[0].reporterId).toBe('user-B');
    });

    it('/claims/mine returns ONLY the authenticated caller’s own claims', async () => {
      // User B queries own claims (User B has a claim on Item A1)
      const resB = await app.inject({
        method: 'GET',
        url: '/api/v1/claims/mine',
        headers: { authorization: `Bearer ${tokenUserB}` },
      });
      expect(resB.statusCode).toBe(200);
      const claimsB = JSON.parse(resB.payload);
      expect(claimsB.length).toBe(1);
      expect(claimsB[0].claimantId).toBe('user-B');

      // User A queries own claims (User A has submitted 0 claims)
      const resA = await app.inject({
        method: 'GET',
        url: '/api/v1/claims/mine',
        headers: { authorization: `Bearer ${tokenUserA}` },
      });
      expect(resA.statusCode).toBe(200);
      const claimsA = JSON.parse(resA.payload);
      expect(claimsA.length).toBe(0);
    });

    it('/notifications returns ONLY the authenticated caller’s own notifications', async () => {
      // User A notifications
      const resA = await app.inject({
        method: 'GET',
        url: '/api/v1/notifications',
        headers: { authorization: `Bearer ${tokenUserA}` },
      });
      expect(resA.statusCode).toBe(200);
      const notifsA = JSON.parse(resA.payload);
      expect(notifsA.length).toBe(1);
      expect(notifsA[0].id).toBe('notif-A');
      expect(notifsA[0].message).toBe('Private alert for User A');

      // User B notifications
      const resB = await app.inject({
        method: 'GET',
        url: '/api/v1/notifications',
        headers: { authorization: `Bearer ${tokenUserB}` },
      });
      expect(resB.statusCode).toBe(200);
      const notifsB = JSON.parse(resB.payload);
      expect(notifsB.length).toBe(1);
      expect(notifsB[0].id).toBe('notif-B');
      expect(notifsB[0].message).toBe('Private alert for User B');
    });

    it('/saved-searches returns ONLY the authenticated caller’s own saved searches', async () => {
      const resA = await app.inject({
        method: 'GET',
        url: '/api/v1/saved-searches',
        headers: { authorization: `Bearer ${tokenUserA}` },
      });
      expect(resA.statusCode).toBe(200);
      const searchesA = JSON.parse(resA.payload);
      expect(searchesA.length).toBe(1);
      expect(searchesA[0].id).toBe('search-A');

      const resB = await app.inject({
        method: 'GET',
        url: '/api/v1/saved-searches',
        headers: { authorization: `Bearer ${tokenUserB}` },
      });
      expect(resB.statusCode).toBe(200);
      const searchesB = JSON.parse(resB.payload);
      expect(searchesB.length).toBe(1);
      expect(searchesB[0].id).toBe('search-B');
    });

    it('GET /items/:caseId returns full case to owner, but masked public view to non-owner in same campus', async () => {
      // User A (Owner of item-A1 CIRS-2026-100001) gets full details
      const resOwner = await app.inject({
        method: 'GET',
        url: '/api/v1/items/CIRS-2026-100001',
        headers: { authorization: `Bearer ${tokenUserA}` },
      });
      expect(resOwner.statusCode).toBe(200);
      const ownerData = JSON.parse(resOwner.payload);
      expect(ownerData.serialNumber).toBe('SN-DELL-SECRET-999');
      expect(ownerData.reporterId).toBe('user-A');
      expect(ownerData.reporter).toBeDefined();
      expect(ownerData.reporter.email).toBe('student.a@gsfcuniversity.ac.in');

      // User B (Non-owner in same campus) gets strictly masked public view (INT-5, FR-12)
      const resNonOwner = await app.inject({
        method: 'GET',
        url: '/api/v1/items/CIRS-2026-100001',
        headers: { authorization: `Bearer ${tokenUserB}` },
      });
      expect(resNonOwner.statusCode).toBe(200);
      const publicData = JSON.parse(resNonOwner.payload);
      expect(publicData.caseId).toBe('CIRS-2026-100001');
      expect(publicData.itemName).toBe("User A's Found Laptop");
      // SENSITIVE OWNERSHIP & PERSONAL FIELDS MUST BE MASKED:
      expect(publicData.serialNumber).toBeUndefined();
      expect(publicData.reporterId).toBeUndefined();
      expect(publicData.reporter).toBeUndefined();
      expect(publicData.storageLocationId).toBeUndefined();
      expect(publicData.claims).toBeUndefined();
    });

    it('User B CANNOT edit User A’s item (403 Forbidden, no mutation)', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/v1/items/CIRS-2026-100001',
        headers: { authorization: `Bearer ${tokenUserB}` },
        payload: {
          itemName: 'Hacked Item Name',
        },
      });
      expect(res.statusCode).toBe(403);
      const body = JSON.parse(res.payload);
      expect(body.message).toMatch(/only edit your own report/i);

      // Verify no state mutation occurred
      expect(itemsDb.get('item-A1').itemName).toBe("User A's Found Laptop");
    });

    it('User B CANNOT cancel User A’s item (403 Forbidden, no mutation)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/items/CIRS-2026-100001/cancel',
        headers: { authorization: `Bearer ${tokenUserB}` },
      });
      expect(res.statusCode).toBe(403);
      const body = JSON.parse(res.payload);
      expect(body.message).toMatch(/only cancel your own case/i);

      // Verify no status change
      expect(itemsDb.get('item-A1').status).toBe(ItemStatus.FOUND);
    });

    it('User B CANNOT view case messages on User A’s item (403 Forbidden)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/items/CIRS-2026-100001/messages',
        headers: { authorization: `Bearer ${tokenUserB}` },
      });
      expect(res.statusCode).toBe(403);
      const body = JSON.parse(res.payload);
      expect(body.message).toMatch(/Only the case reporter and security staff/i);
    });

    it('User A CANNOT view User B’s claim details (403 Forbidden)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/claims/claim-B-on-A1',
        headers: { authorization: `Bearer ${tokenUserA}` },
      });
      expect(res.statusCode).toBe(403);
      const body = JSON.parse(res.payload);
      expect(body.message).toMatch(/do not have permission to view this claim/i);
    });

    it('User A CANNOT withdraw User B’s claim (403 Forbidden, no mutation)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/claims/claim-B-on-A1/withdraw',
        headers: { authorization: `Bearer ${tokenUserA}` },
      });
      expect(res.statusCode).toBe(403);
      const body = JSON.parse(res.payload);
      expect(body.message).toMatch(/only withdraw your own claim/i);
      expect(claimsDb.get('claim-B-on-A1').status).toBe(ClaimStatus.PENDING);
    });

    it('User A CANNOT submit answers for User B’s claim (403 Forbidden, no mutation)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/claims/claim-B-on-A1/answers',
        headers: { authorization: `Bearer ${tokenUserA}` },
        payload: { answers: [{ questionId: 'q-1', answerText: 'Forged answer' }] },
      });
      expect(res.statusCode).toBe(403);
      const body = JSON.parse(res.payload);
      expect(body.message).toMatch(/only answer questions for your own claim/i);
    });

    it('User A CANNOT appeal User B’s claim (403 Forbidden, no mutation)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/claims/claim-B-on-A1/appeals',
        headers: { authorization: `Bearer ${tokenUserA}` },
        payload: { reason: 'Unauthorized appeal' },
      });
      expect(res.statusCode).toBe(403);
      const body = JSON.parse(res.payload);
      expect(body.message).toMatch(/only appeal your own claim/i);
    });

    it('User A CANNOT mark User B’s notification as read (403 Forbidden, no mutation)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/notifications/notif-B/read',
        headers: { authorization: `Bearer ${tokenUserA}` },
      });
      expect(res.statusCode).toBe(403);
      const body = JSON.parse(res.payload);
      expect(body.message).toMatch(/only update your own notifications/i);
      expect(notificationsDb.get('notif-B').readAt).toBeNull();
    });

    it('User A CANNOT delete User B’s saved search (403 Forbidden, no deletion)', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: '/api/v1/saved-searches/search-B',
        headers: { authorization: `Bearer ${tokenUserA}` },
      });
      expect(res.statusCode).toBe(403);
      const body = JSON.parse(res.payload);
      expect(body.message).toMatch(/only delete your own saved searches/i);
      expect(savedSearchesDb.has('search-B')).toBe(true);
    });

    it('User A CANNOT claim an item they reported as found (400 Bad Request)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/items/CIRS-2026-100001/claims',
        headers: { authorization: `Bearer ${tokenUserA}` },
        payload: {
          description: 'Attempting to claim own found item',
          colour: 'Silver',
          brand: 'Dell',
          identifyingMarks: 'Mine',
        },
      });
      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.message).toMatch(/cannot claim an item you reported as found/i);
    });
  });

  // =========================================================================
  // 2. CAMPUS (TENANCY) ISOLATION (INV-DM-7, INT-6)
  // =========================================================================
  describe('2. Campus (Tenancy) Isolation Guarantees (INV-DM-7, INT-6)', () => {
    it('User C (Campus 2) CANNOT read item in Campus 1 (403 Forbidden: Tenancy violation)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/items/CIRS-2026-100001',
        headers: { authorization: `Bearer ${tokenUserC}` },
      });
      expect(res.statusCode).toBe(403);
      const body = JSON.parse(res.payload);
      expect(body.message).toMatch(/Cross-campus access is forbidden/i);
    });

    it('User A (Campus 1) CANNOT read item in Campus 2 (403 Forbidden: Tenancy violation)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/items/CIRS-2026-200001',
        headers: { authorization: `Bearer ${tokenUserA}` },
      });
      expect(res.statusCode).toBe(403);
      const body = JSON.parse(res.payload);
      expect(body.message).toMatch(/Cross-campus access is forbidden/i);
    });

    it('/feed strictly scopes results to caller’s campus (Campus 1 never sees Campus 2)', async () => {
      // User A (Campus 1) queries feed
      const resA = await app.inject({
        method: 'GET',
        url: '/api/v1/feed',
        headers: { authorization: `Bearer ${tokenUserA}` },
      });
      expect(resA.statusCode).toBe(200);
      const feedA = JSON.parse(resA.payload);
      const caseIdsA = feedA.data.map((i: any) => i.caseId);
      expect(caseIdsA).toContain('CIRS-2026-100001');
      expect(caseIdsA).not.toContain('CIRS-2026-200001'); // Campus 2 item excluded!

      // User C (Campus 2) queries feed
      const resC = await app.inject({
        method: 'GET',
        url: '/api/v1/feed',
        headers: { authorization: `Bearer ${tokenUserC}` },
      });
      expect(resC.statusCode).toBe(200);
      const feedC = JSON.parse(resC.payload);
      const caseIdsC = feedC.data.map((i: any) => i.caseId);
      expect(caseIdsC).toContain('CIRS-2026-200001');
      expect(caseIdsC).not.toContain('CIRS-2026-100001'); // Campus 1 item excluded!
    });

    it('User C (Campus 2) CANNOT submit claim on Campus 1 item (403 Forbidden)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/items/CIRS-2026-100001/claims',
        headers: { authorization: `Bearer ${tokenUserC}` },
        payload: {
          description: 'Cross-campus claim attempt',
          colour: 'Silver',
          brand: 'Dell',
          identifyingMarks: 'Unknown',
        },
      });
      expect(res.statusCode).toBe(403);
      const body = JSON.parse(res.payload);
      expect(body.message).toMatch(/Cross-campus access is forbidden/i);
    });

    it('Admin in Campus 1 cannot see storage locations in Campus 2', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/storage-locations',
        headers: { authorization: `Bearer ${tokenAdminCampus1}` },
      });
      expect(res.statusCode).toBe(200);
      const locs = JSON.parse(res.payload);
      const locIds = locs.map((l: any) => l.id);
      expect(locIds).toContain('loc-campus-1');
      expect(locIds).not.toContain('loc-campus-2');
    });

    it('Admin in Campus 2 CANNOT modify a storage location in Campus 1 (403 Forbidden)', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/v1/admin/storage-locations/loc-campus-1',
        headers: { authorization: `Bearer ${tokenAdminCampus2}` },
        payload: { name: 'LIBRARY' },
      });
      expect(res.statusCode).toBe(403);
      const body = JSON.parse(res.payload);
      expect(body.message).toMatch(/Cross-campus access is forbidden/i);
    });

    it('Admin in Campus 2 queries /admin/items and receives ONLY Campus 2 records', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/items',
        headers: { authorization: `Bearer ${tokenAdminCampus2}` },
      });
      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.payload);
      const caseIds = data.items.map((i: any) => i.caseId);
      expect(caseIds).toContain('CIRS-2026-200001');
      expect(caseIds).not.toContain('CIRS-2026-100001');
      expect(caseIds).not.toContain('CIRS-2026-100002');
    });

    it('Tenancy Scoped Query Helper (applyCampusScope) strictly fails fast on missing or empty campusId', () => {
      // Must throw fatal error on empty, whitespace, or undefined campusId (never falls back to unscoped)
      expect(() => applyCampusScope('', { status: 'FOUND' })).toThrow(
        'Tenancy violation: campusId must be provided for scoped queries',
      );
      expect(() => applyCampusScope('   ', { status: 'FOUND' })).toThrow(
        'Tenancy violation: campusId must be provided for scoped queries',
      );
      expect(() => applyCampusScope(undefined as any, { status: 'FOUND' })).toThrow(
        'Tenancy violation: campusId must be provided for scoped queries',
      );
      expect(() => applyCampusScope(null as any, { status: 'FOUND' })).toThrow(
        'Tenancy violation: campusId must be provided for scoped queries',
      );
    });
  });

  // =========================================================================
  // 3. AUTH BOUNDARY VERIFICATION
  // =========================================================================
  describe('3. Auth Boundary Verification', () => {
    it('Unauthenticated request to /api/v1/items/mine returns 401 Unauthorized', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/items/mine',
      });
      expect(res.statusCode).toBe(401);
    });

    it('Unauthenticated request to /api/v1/claims/mine returns 401 Unauthorized', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/claims/mine',
      });
      expect(res.statusCode).toBe(401);
    });

    it('Unauthenticated request to /api/v1/admin/items returns 401 Unauthorized', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/items',
      });
      expect(res.statusCode).toBe(401);
    });

    it('Non-admin (student) request to /api/v1/admin/items returns 403 Forbidden', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/items',
        headers: { authorization: `Bearer ${tokenUserA}` },
      });
      expect(res.statusCode).toBe(403);
    });

    it('Non-admin (student) request to /api/v1/admin/storage-locations returns 403 Forbidden', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/storage-locations',
        headers: { authorization: `Bearer ${tokenUserA}` },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // =========================================================================
  // 4. TIE TO ISSUE #2: TWO DISTINCT REGISTERED ACCOUNTS
  // =========================================================================
  describe('4. Tie to Issue #2: Two Distinct Registered Accounts', () => {
    it('A newly registered user has zero initial items, claims, and notifications (disproves "same data after registering")', async () => {
      // Simulate registering fresh account User D
      const newUserD = {
        id: 'user-D',
        name: 'Fresh Student D',
        email: 'student.d@gsfcuniversity.ac.in',
        role: Role.STUDENT,
        campusId: 'campus-1',
        departmentId: 'dept-cse',
        status: UserStatus.ACTIVE,
      };
      usersDb.set('user-D', newUserD);

      const tokenUserD = await jwtService.signAsync({
        sub: 'user-D',
        email: 'student.d@gsfcuniversity.ac.in',
        role: Role.STUDENT,
        campusId: 'campus-1',
        departmentId: 'dept-cse',
      });

      // 1. /items/mine must be EMPTY
      const resItems = await app.inject({
        method: 'GET',
        url: '/api/v1/items/mine',
        headers: { authorization: `Bearer ${tokenUserD}` },
      });
      expect(resItems.statusCode).toBe(200);
      expect(JSON.parse(resItems.payload)).toEqual([]);

      // 2. /claims/mine must be EMPTY
      const resClaims = await app.inject({
        method: 'GET',
        url: '/api/v1/claims/mine',
        headers: { authorization: `Bearer ${tokenUserD}` },
      });
      expect(resClaims.statusCode).toBe(200);
      expect(JSON.parse(resClaims.payload)).toEqual([]);

      // 3. /notifications must be EMPTY
      const resNotifs = await app.inject({
        method: 'GET',
        url: '/api/v1/notifications',
        headers: { authorization: `Bearer ${tokenUserD}` },
      });
      expect(resNotifs.statusCode).toBe(200);
      expect(JSON.parse(resNotifs.payload)).toEqual([]);

      // 4. /saved-searches must be EMPTY
      const resSearches = await app.inject({
        method: 'GET',
        url: '/api/v1/saved-searches',
        headers: { authorization: `Bearer ${tokenUserD}` },
      });
      expect(resSearches.statusCode).toBe(200);
      expect(JSON.parse(resSearches.payload)).toEqual([]);
    });
  });
});
