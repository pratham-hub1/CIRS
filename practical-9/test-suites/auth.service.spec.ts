import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthService } from '../src/modules/auth/auth.service';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { TenancyService } from '../src/modules/tenancy/tenancy.service';
import { Role, UserStatus } from '../src/domain/enums';

describe('AuthService (Phase 1: FR-1..5, INT-10)', () => {
  let authService: AuthService;
  let prisma: any;
  let tenancyService: any;
  let jwtService: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      refreshToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    tenancyService = {
      validateCampus: jest.fn().mockResolvedValue({ id: 'campus-1' }),
      validateDepartment: jest.fn().mockResolvedValue({ id: 'dept-1' }),
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('mock-access-token'),
      verifyAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: TenancyService, useValue: tenancyService },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              if (key === 'universityEmailDomains') return ['gsfcuniversity.ac.in'];
              if (key === 'jwt.accessSecret') return 'test-access-secret';
              if (key === 'jwt.accessExpiration') return 900;
              if (key === 'jwt.refreshExpiration') return 604800;
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('FR-4: University Email Domain Restriction', () => {
    it('accepts university email domains', () => {
      expect(() =>
        authService.validateUniversityEmail('student@gsfcuniversity.ac.in'),
      ).not.toThrow();
    });

    it('rejects non-university email domains', () => {
      expect(() =>
        authService.validateUniversityEmail('hacker@gmail.com'),
      ).toThrow(BadRequestException);
      expect(() =>
        authService.validateUniversityEmail('user@otheruniv.edu'),
      ).toThrow(BadRequestException);
    });
  });

  describe('FR-1: Registration & Login with argon2id', () => {
    it('registers a new user with argon2id hashed password', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(({ data }: any) => {
        return Promise.resolve({
          id: 'user-1',
          name: data.name,
          email: data.email,
          role: data.role,
          campusId: data.campusId,
          departmentId: data.departmentId,
          createdAt: new Date(),
        });
      });

      const result = await authService.register({
        name: 'Test Student',
        email: 'student@gsfcuniversity.ac.in',
        password: 'Password123!',
        campusId: 'campus-1',
      });

      expect(result.id).toBe('user-1');
      expect(result.email).toBe('student@gsfcuniversity.ac.in');
      expect(prisma.user.create).toHaveBeenCalled();

      // Ensure argon2 was used
      const createCall = prisma.user.create.mock.calls[0][0];
      expect(createCall.data.passwordHash).toBeDefined();
      expect(createCall.data.passwordHash).not.toBe('Password123!');
      const isArgon = await argon2.verify(createCall.data.passwordHash, 'Password123!');
      expect(isArgon).toBe(true);
    });

    it('login succeeds with valid credentials and returns access token + refresh token', async () => {
      const passwordHash = await argon2.hash('Password123!', { type: argon2.argon2id });
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Test Student',
        email: 'student@gsfcuniversity.ac.in',
        passwordHash,
        role: Role.STUDENT,
        campusId: 'campus-1',
        status: UserStatus.ACTIVE,
      });

      prisma.refreshToken.create.mockResolvedValue({
        id: 'token-uuid',
        familyId: 'family-1',
      });

      const res = await authService.login({
        email: 'student@gsfcuniversity.ac.in',
        password: 'Password123!',
      });

      expect(res.accessToken).toBe('mock-access-token');
      expect(res.refreshToken).toMatch(/^token-uuid\./);
      expect(res.user.id).toBe('user-1');
    });

    it('login fails generic 401 on incorrect password without leaking user existence', async () => {
      const passwordHash = await argon2.hash('CorrectPassword', { type: argon2.argon2id });
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'student@gsfcuniversity.ac.in',
        passwordHash,
        status: UserStatus.ACTIVE,
      });

      await expect(
        authService.login({
          email: 'student@gsfcuniversity.ac.in',
          password: 'WrongPassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('login fails generic 401 when user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'nonexistent@gsfcuniversity.ac.in',
          password: 'AnyPassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('INT-10: Refresh Token Rotation & Replay Revocation', () => {
    it('rotates valid refresh token and issues successor with same familyId', async () => {
      const crypto = require('crypto');
      const secret = 'test-secret';
      const tokenHash = crypto.createHash('sha256').update(secret).digest('hex');

      const existingToken = {
        id: 'token-1',
        userId: 'user-1',
        familyId: 'family-abc',
        tokenHash,
        expiresAt: new Date(Date.now() + 100000),
        revokedAt: null,
        user: {
          id: 'user-1',
          name: 'Student',
          email: 'student@gsfcuniversity.ac.in',
          role: Role.STUDENT,
          campusId: 'campus-1',
          status: UserStatus.ACTIVE,
        },
      };

      prisma.refreshToken.findUnique.mockResolvedValue(existingToken);
      prisma.refreshToken.create.mockResolvedValue({
        id: 'token-2',
        familyId: 'family-abc',
      });
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      const res = await authService.refresh(`token-1.${secret}`);

      expect(res.accessToken).toBe('mock-access-token');
      expect(res.refreshToken).toMatch(/^token-2\./);
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { id: 'token-1', revokedAt: null },
        data: expect.objectContaining({
          replacedById: 'token-2',
        }),
      });
    });

    it('INT-10(c): detects replay of already revoked token and revokes entire family', async () => {
      const crypto = require('crypto');
      const secret = 'compromised-secret';
      const tokenHash = crypto.createHash('sha256').update(secret).digest('hex');

      const alreadyRevokedToken = {
        id: 'token-1',
        userId: 'user-1',
        familyId: 'family-compromised',
        tokenHash,
        expiresAt: new Date(Date.now() + 100000),
        revokedAt: new Date(Date.now() - 10000), // ALREADY REVOKED!
        user: {
          id: 'user-1',
          status: UserStatus.ACTIVE,
        },
      };

      prisma.refreshToken.findUnique.mockResolvedValue(alreadyRevokedToken);
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });

      await expect(
        authService.refresh(`token-1.${secret}`),
      ).rejects.toThrow(UnauthorizedException);

      // Asserts entire family was revoked
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          familyId: 'family-compromised',
          revokedAt: null,
        },
        data: expect.objectContaining({
          revokedAt: expect.any(Date),
        }),
      });
    });
  });

  describe('FR-2: Logout', () => {
    it('revokes the token family upon logout with refresh token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'token-1',
        familyId: 'family-logout',
      });

      await authService.logout('user-1', 'token-1.secret');

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          familyId: 'family-logout',
          revokedAt: null,
        },
        data: expect.objectContaining({
          revokedAt: expect.any(Date),
        }),
      });
    });
  });
});
