import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';

describe('CampusesController (Contract Amendment: Public Campus Discovery)', () => {
  let app: NestFastifyApplication;

  const mockCampuses = [
    {
      id: 'campus-gsfc-main',
      name: 'GSFC University Main Campus',
      code: 'GSFCU-MAIN',
      departments: [
        {
          id: 'dept-sot-cse',
          name: 'School of Technology - Computer Science & Engineering',
          code: 'SOT-CSE',
        },
      ],
    },
  ];

  beforeAll(async () => {
    const mockPrisma = {
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
      onModuleInit: jest.fn().mockResolvedValue(undefined),
      onModuleDestroy: jest.fn().mockResolvedValue(undefined),
      campus: {
        findMany: jest.fn().mockResolvedValue(mockCampuses),
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/campuses is publicly accessible without authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/campuses',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.data).toBeDefined();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBe(1);
    expect(body.data[0].id).toBe('campus-gsfc-main');
    expect(body.data[0].name).toBe('GSFC University Main Campus');
    expect(body.data[0].departments[0].code).toBe('SOT-CSE');
  });
});
