import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Role, UserStatus } from '../src/domain/enums';

describe('Security & Authentication Regression Tests (Issue 3)', () => {
  let app: NestFastifyApplication;
  let jwtService: JwtService;
  let studentToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const mockPrisma = {
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
      onModuleInit: jest.fn().mockResolvedValue(undefined),
      onModuleDestroy: jest.fn().mockResolvedValue(undefined),
      user: {
        findUnique: jest.fn().mockImplementation(({ where }: any) => {
          if (where.id === 'user-student-1') {
            return Promise.resolve({
              id: 'user-student-1',
              email: 'student.test@gsfcuniversity.ac.in',
              role: Role.STUDENT,
              campusId: 'campus-1',
              departmentId: 'dept-cse',
              status: UserStatus.ACTIVE,
            });
          }
          if (where.id === 'user-admin-1') {
            return Promise.resolve({
              id: 'user-admin-1',
              email: 'admin@gsfcuniversity.ac.in',
              role: Role.ADMIN,
              campusId: 'campus-1',
              departmentId: 'dept-cse',
              status: UserStatus.ACTIVE,
            });
          }
          return Promise.resolve(null);
        }),
      },
      item: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      claim: {
        count: jest.fn().mockResolvedValue(0),
      },
      storageLocation: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
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

    app.setGlobalPrefix('api/v1', {
      exclude: ['health'],
    });

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    // Create valid signed test tokens
    studentToken = await jwtService.signAsync({
      sub: 'user-student-1',
      email: 'student.test@gsfcuniversity.ac.in',
      role: Role.STUDENT,
      campusId: 'campus-1',
      departmentId: 'dept-cse',
    });

    adminToken = await jwtService.signAsync({
      sub: 'user-admin-1',
      email: 'admin@gsfcuniversity.ac.in',
      role: Role.ADMIN,
      campusId: 'campus-1',
      departmentId: 'dept-cse',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Unauthenticated Request Rejection (401 Unauthorized)', () => {
    it('rejects unauthenticated request to /api/v1/users/me', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/users/me',
      });
      expect(res.statusCode).toBe(401);
      const body = JSON.parse(res.payload);
      expect(body.message).toMatch(/Authentication required|Unauthorized/i);
    });

    it('rejects unauthenticated request to /api/v1/items', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/items',
      });
      expect(res.statusCode).toBe(401);
    });

    it('rejects unauthenticated request to /api/v1/feed', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/feed',
      });
      expect(res.statusCode).toBe(401);
    });

    it('strictly forbids unauthenticated access to admin endpoints (/api/v1/admin/analytics)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/analytics',
      });
      expect(res.statusCode).toBe(401);
    });

    it('strictly forbids unauthenticated access to admin items (/api/v1/admin/items)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/items',
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('Role-Based Access Control & Privilege Escalation Prevention (403 Forbidden)', () => {
    it('rejects student attempting to access admin analytics with 403 Forbidden', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/analytics',
        headers: {
          authorization: `Bearer ${studentToken}`,
        },
      });
      expect(res.statusCode).toBe(403);
    });

    it('rejects student attempting to access admin audit log with 403 Forbidden', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/audit-log',
        headers: {
          authorization: `Bearer ${studentToken}`,
        },
      });
      expect(res.statusCode).toBe(403);
    });

    it('allows admin to access admin analytics with 200 OK', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/analytics',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });
      expect(res.statusCode).toBe(200);
    });
  });
});
