import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../src/modules/auth/auth.service';
import { UsersService } from '../src/modules/users/users.service';
import { SearchService } from '../src/modules/search/search.service';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { TenancyService } from '../src/modules/tenancy/tenancy.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Role, UserStatus, ItemStatus, ItemType, ItemCategory } from '../src/domain/enums';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';

describe('Evidence Verification: Registration, Auth, Profile & Feed (Issue 2)', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let searchService: SearchService;
  let prisma: any;
  let tenancyService: TenancyService;

  const mockUsersDb = new Map<string, any>();
  const mockItemsDb = new Map<string, any>();

  beforeEach(async () => {
    mockUsersDb.clear();
    mockItemsDb.clear();

    prisma = {
      campus: {
        findUnique: jest.fn().mockImplementation(({ where }: any) => {
          if (where.id === 'campus-1') {
            return Promise.resolve({ id: 'campus-1', name: 'GSFC University Main Campus', code: 'GSFCU-MAIN' });
          }
          return Promise.resolve(null);
        }),
      },
      department: {
        findFirst: jest.fn().mockImplementation(({ where }: any) => {
          if (where.id === 'dept-cse' && where.campusId === 'campus-1') {
            return Promise.resolve({ id: 'dept-cse', campusId: 'campus-1', name: 'Computer Science', code: 'CSE' });
          }
          return Promise.resolve(null);
        }),
      },
      user: {
        findUnique: jest.fn().mockImplementation(({ where }: any) => {
          if (where.email) {
            for (const user of mockUsersDb.values()) {
              if (user.email === where.email) return Promise.resolve(user);
            }
          }
          if (where.id) {
            return Promise.resolve(mockUsersDb.get(where.id) || null);
          }
          return Promise.resolve(null);
        }),
        create: jest.fn().mockImplementation(({ data }: any) => {
          const id = `user-${mockUsersDb.size + 1}`;
          const created = {
            id,
            name: data.name,
            email: data.email,
            passwordHash: data.passwordHash,
            role: data.role || Role.STUDENT,
            campusId: data.campusId,
            departmentId: data.departmentId || null,
            status: UserStatus.ACTIVE,
            createdAt: new Date(),
          };
          mockUsersDb.set(id, created);
          return Promise.resolve(created);
        }),
      },
      refreshToken: {
        create: jest.fn().mockResolvedValue({ id: 'rt-1' }),
      },
      item: {
        findMany: jest.fn().mockImplementation(({ where }: any) => {
          const results: any[] = [];
          for (const item of mockItemsDb.values()) {
            if (where.campusId && item.campusId !== where.campusId) continue;
            if (where.status?.in && !where.status.in.includes(item.status)) continue;
            results.push(item);
          }
          return Promise.resolve(results);
        }),
      },
    };

    const configService = {
      get: jest.fn().mockImplementation((key: string, defaultValue?: any) => {
        if (key === 'universityEmailDomains') return ['gsfcuniversity.ac.in'];
        if (key === 'jwt.accessSecret') return 'test-access-secret-32-characters-min!';
        if (key === 'jwt.refreshSecret') return 'test-refresh-secret-32-characters-min!';
        if (key === 'jwt.accessExpiration') return 900;
        if (key === 'jwt.refreshExpiration') return 604800;
        return defaultValue;
      }),
    };

    const jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-jwt-access-token'),
    };

    tenancyService = new TenancyService(prisma);
    authService = new AuthService(prisma, jwtService as any, configService as any, tenancyService);
    usersService = new UsersService(prisma, tenancyService);
    searchService = new SearchService(prisma, tenancyService);
  });

  it('Evidence 1: Registration creates a distinct user row with argon2id hash; rejects unknown campus with 400', async () => {
    // Attempt registration with invalid campusId -> must fail with 400 Bad Request
    await expect(
      authService.register({
        name: 'Alice Smith',
        email: 'alice.smith@gsfcuniversity.ac.in',
        password: 'Password123!',
        campusId: 'non-existent-campus',
      }),
    ).rejects.toThrow(BadRequestException);

    // Register User 1
    const user1 = await authService.register({
      name: 'Alice Smith',
      email: 'alice.smith@gsfcuniversity.ac.in',
      password: 'Password123!',
      campusId: 'campus-1',
      departmentId: 'dept-cse',
      role: Role.STUDENT,
    });

    expect(user1.id).toBeDefined();
    expect(user1.email).toBe('alice.smith@gsfcuniversity.ac.in');
    expect(mockUsersDb.has(user1.id)).toBe(true);

    const storedUser1 = mockUsersDb.get(user1.id);
    expect(await argon2.verify(storedUser1.passwordHash, 'Password123!')).toBe(true);

    // Register User 2 -> distinct row
    const user2 = await authService.register({
      name: 'Bob Johnson',
      email: 'bob.johnson@gsfcuniversity.ac.in',
      password: 'DifferentPassword456!',
      campusId: 'campus-1',
      role: Role.FACULTY,
    });

    expect(user2.id).not.toBe(user1.id);
    expect(mockUsersDb.size).toBe(2);
  });

  it('Evidence 2: Login authenticates real credentials and issues unique user session', async () => {
    // Seed real user
    const passwordHash = await argon2.hash('SecretPass999!', { type: argon2.argon2id });
    mockUsersDb.set('user-seed', {
      id: 'user-seed',
      name: 'Real User',
      email: 'real.user@gsfcuniversity.ac.in',
      passwordHash,
      role: Role.STUDENT,
      campusId: 'campus-1',
      status: UserStatus.ACTIVE,
    });

    // Wrong password -> fails
    await expect(
      authService.login({
        email: 'real.user@gsfcuniversity.ac.in',
        password: 'WrongPassword!',
      }),
    ).rejects.toThrow(UnauthorizedException);

    // Correct password -> succeeds and returns user info
    const loginResult = await authService.login({
      email: 'real.user@gsfcuniversity.ac.in',
      password: 'SecretPass999!',
    });

    expect(loginResult.accessToken).toBeDefined();
    expect(loginResult.user.id).toBe('user-seed');
    expect(loginResult.user.email).toBe('real.user@gsfcuniversity.ac.in');
  });

  it('Evidence 3: GET /api/v1/users/me returns the authenticated user profile from DB', async () => {
    mockUsersDb.set('user-target', {
      id: 'user-target',
      name: 'Profile Owner',
      email: 'profile.owner@gsfcuniversity.ac.in',
      role: Role.ADMIN,
      campusId: 'campus-1',
      departmentId: 'dept-cse',
      createdAt: new Date(),
      campus: { id: 'campus-1', name: 'GSFC University Main Campus', code: 'GSFCU-MAIN' },
      department: { id: 'dept-cse', name: 'Computer Science', code: 'CSE' },
      notificationPreference: { emailEnabled: true, digestEnabled: false },
    });

    const profile = await usersService.getProfile('user-target');
    expect(profile.id).toBe('user-target');
    expect(profile.name).toBe('Profile Owner');
    expect(profile.role).toBe(Role.ADMIN);
  });

  it('Evidence 4: Community feed returns real database rows, not hardcoded dummy data', async () => {
    const user = {
      id: 'user-viewer',
      email: 'viewer@gsfcuniversity.ac.in',
      role: Role.STUDENT,
      campusId: 'campus-1',
    };

    // When DB is empty, feed returns empty array (not dummy sample data!)
    const emptyFeed = await searchService.getCommunityFeed(user, { limit: 20 });
    expect(emptyFeed.data).toEqual([]);

    // Insert real item into DB
    mockItemsDb.set('item-1', {
      id: 'item-1',
      caseId: 'CIRS-2026-000100',
      type: ItemType.FOUND,
      itemName: 'Real Silver Watch',
      category: ItemCategory.ACCESSORIES,
      colour: 'Silver',
      brand: 'Titan',
      campusId: 'campus-1',
      status: ItemStatus.FOUND,
      archivedAt: null,
      images: [],
      createdAt: new Date(),
    });

    const populatedFeed = await searchService.getCommunityFeed(user, { limit: 20 });
    expect(populatedFeed.data.length).toBe(1);
    expect(populatedFeed.data[0].caseId).toBe('CIRS-2026-000100');
    expect(populatedFeed.data[0].itemName).toBe('Real Silver Watch');
  });
});
