import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Role, FileVisibility, StorageLocationName } from '../src/domain/enums';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';

describe('File Serving (INV-DM-11) & Storage Locations Access Control', () => {
  let app: NestFastifyApplication;
  let jwtService: JwtService;

  // In-memory mock database
  const storageLocationsDb: any[] = [
    { id: 'loc-sec-office', campusId: 'campus-1', name: StorageLocationName.SECURITY_OFFICE },
    { id: 'loc-library', campusId: 'campus-1', name: StorageLocationName.LIBRARY },
    { id: 'loc-lab', campusId: 'campus-1', name: StorageLocationName.LABORATORY },
    { id: 'loc-dept', campusId: 'campus-1', name: StorageLocationName.DEPARTMENT_OFFICE },
    { id: 'loc-reception', campusId: 'campus-1', name: StorageLocationName.RECEPTION },
    { id: 'loc-campus-2', campusId: 'campus-2', name: StorageLocationName.SECURITY_OFFICE },
  ];

  const filesDb = new Map<string, any>();
  const usersDb = new Map<string, any>();

  let tokenStudentA: string;
  let tokenStudentB: string;
  let tokenAdmin: string;

  const testUploadDir = path.resolve(process.cwd(), './uploads');

  beforeAll(async () => {
    if (!fs.existsSync(testUploadDir)) {
      fs.mkdirSync(testUploadDir, { recursive: true });
    }

    // Seed test files on disk in the uploadDir used by LocalStorageDriver
    fs.writeFileSync(path.join(testUploadDir, 'image-item.jpg'), Buffer.from('jpeg-item-image-bytes'));
    fs.writeFileSync(path.join(testUploadDir, 'doc-proof.pdf'), Buffer.from('pdf-claim-proof-bytes'));

    // Users
    usersDb.set('student-a', {
      id: 'student-a',
      email: 'student.a@gsfcuniversity.ac.in',
      role: Role.STUDENT,
      campusId: 'campus-1',
    });
    usersDb.set('student-b', {
      id: 'student-b',
      email: 'student.b@gsfcuniversity.ac.in',
      role: Role.STUDENT,
      campusId: 'campus-1',
    });
    usersDb.set('admin-1', {
      id: 'admin-1',
      email: 'admin@gsfcuniversity.ac.in',
      role: Role.ADMIN,
      campusId: 'campus-1',
    });

    // Files in mock DB
    filesDb.set('file-item-img', {
      id: 'file-item-img',
      storageKey: 'image-item.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 21,
      visibility: FileVisibility.AUTHENTICATED,
      uploadedById: 'student-a',
      createdAt: new Date(),
    });

    filesDb.set('file-proof-doc', {
      id: 'file-proof-doc',
      storageKey: 'doc-proof.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 21,
      visibility: FileVisibility.PRIVATE,
      uploadedById: 'student-a',
      createdAt: new Date(),
    });

    const mockPrisma = {
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
      onModuleInit: jest.fn().mockResolvedValue(undefined),
      onModuleDestroy: jest.fn().mockResolvedValue(undefined),
      storageLocation: {
        findMany: jest.fn().mockImplementation(({ where }) => {
          return Promise.resolve(
            storageLocationsDb.filter((loc) => !where?.campusId || loc.campusId === where.campusId),
          );
        }),
      },
      file: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          return Promise.resolve(filesDb.get(where.id) || null);
        }),
        create: jest.fn().mockImplementation(({ data }) => {
          const newFile = { id: `file-${Date.now()}`, ...data, createdAt: new Date() };
          filesDb.set(newFile.id, newFile);
          return Promise.resolve(newFile);
        }),
      },
      user: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          return Promise.resolve(usersDb.get(where.id) || null);
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

    app.setGlobalPrefix('api/v1', {
      exclude: ['health'],
    });

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    // Generate JWT tokens
    tokenStudentA = jwtService.sign({
      sub: 'student-a',
      email: 'student.a@gsfcuniversity.ac.in',
      role: Role.STUDENT,
      campusId: 'campus-1',
    });

    tokenStudentB = jwtService.sign({
      sub: 'student-b',
      email: 'student.b@gsfcuniversity.ac.in',
      role: Role.STUDENT,
      campusId: 'campus-1',
    });

    tokenAdmin = jwtService.sign({
      sub: 'admin-1',
      email: 'admin@gsfcuniversity.ac.in',
      role: Role.ADMIN,
      campusId: 'campus-1',
    });
  });

  afterAll(async () => {
    await app.close();
    const testFile1 = path.join(testUploadDir, 'image-item.jpg');
    const testFile2 = path.join(testUploadDir, 'doc-proof.pdf');
    if (fs.existsSync(testFile1)) fs.unlinkSync(testFile1);
    if (fs.existsSync(testFile2)) fs.unlinkSync(testFile2);
  });

  describe('Storage Locations Access (GET /api/v1/storage-locations)', () => {
    it('allows an authenticated student to fetch campus storage locations', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/storage-locations',
        headers: {
          authorization: `Bearer ${tokenStudentA}`,
        },
      });

      expect(res.statusCode).toBe(200);
      const locations = JSON.parse(res.payload);
      expect(Array.isArray(locations)).toBe(true);
      // Must contain all 5 campus-1 locations, and not campus-2
      expect(locations.length).toBe(5);
      const names = locations.map((l: any) => l.name);
      expect(names).toContain('SECURITY_OFFICE');
      expect(names).toContain('LIBRARY');
      expect(names).toContain('LABORATORY');
      expect(names).toContain('DEPARTMENT_OFFICE');
      expect(names).toContain('RECEPTION');
    });

    it('rejects unauthenticated requests to GET /api/v1/storage-locations with 401', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/storage-locations',
      });

      expect(res.statusCode).toBe(401);
    });

    it('admin CRUD routes (POST/PATCH /admin/storage-locations) remain admin-only (403 for student)', async () => {
      const postRes = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/storage-locations',
        headers: {
          authorization: `Bearer ${tokenStudentA}`,
        },
        payload: {
          name: 'SECURITY_OFFICE',
        },
      });
      expect(postRes.statusCode).toBe(403);

      const patchRes = await app.inject({
        method: 'PATCH',
        url: '/api/v1/admin/storage-locations/loc-sec-office',
        headers: {
          authorization: `Bearer ${tokenStudentA}`,
        },
        payload: {
          name: 'LIBRARY',
        },
      });
      expect(patchRes.statusCode).toBe(403);
    });
  });

  describe('File Serving & INV-DM-11 Access Control (GET /api/v1/files/:id)', () => {
    it('rejects unauthenticated access with 401 Unauthorized', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/files/file-item-img',
      });
      expect(res.statusCode).toBe(401);
    });

    it('returns 404 Not Found for non-existent file ID', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/files/non-existent-file-id',
        headers: {
          authorization: `Bearer ${tokenStudentA}`,
        },
      });
      expect(res.statusCode).toBe(404);
    });

    it('allows any authenticated user (student-b) to stream an AUTHENTICATED file (item image)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/files/file-item-img',
        headers: {
          authorization: `Bearer ${tokenStudentB}`,
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('image/jpeg');
    });

    it('allows the uploader (student-a) to stream their own PRIVATE file (claim proof)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/files/file-proof-doc',
        headers: {
          authorization: `Bearer ${tokenStudentA}`,
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
    });

    it('allows an ADMIN to stream any PRIVATE file (claim proof)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/files/file-proof-doc',
        headers: {
          authorization: `Bearer ${tokenAdmin}`,
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
    });

    it('denies a non-owner student (student-b) from streaming a PRIVATE file with 403 Forbidden (INV-DM-11)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/files/file-proof-doc',
        headers: {
          authorization: `Bearer ${tokenStudentB}`,
        },
      });

      expect(res.statusCode).toBe(403);
      const body = JSON.parse(res.payload);
      expect(body.message).toMatch(/permission/i);
    });
  });
});
