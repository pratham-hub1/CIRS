import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';

describe('CORS and TrustProxy Verification (Pre-Live Check)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn().mockResolvedValue(undefined),
        $disconnect: jest.fn().mockResolvedValue(undefined),
        onModuleInit: jest.fn().mockResolvedValue(undefined),
        onModuleDestroy: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    const adapter = new FastifyAdapter({
      trustProxy: true,
      logger: false,
    });

    adapter.getInstance().get('/test-ip-proxy', (req: any, reply: any) => {
      reply.send({ ip: req.ip });
    });

    app = moduleFixture.createNestApplication<NestFastifyApplication>(adapter);

    app.enableCors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });

    app.setGlobalPrefix('api/v1', {
      exclude: ['health'],
    });

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('responds with CORS headers on requests from Cloudflare tunnel origins', async () => {
    const cloudflareOrigin = 'https://cirs-frontend-tunnel.trycloudflare.com';
    const response = await app.inject({
      method: 'GET',
      url: '/health',
      headers: {
        origin: cloudflareOrigin,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe(cloudflareOrigin);
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('handles CORS OPTIONS preflight requests for API endpoints', async () => {
    const frontendOrigin = 'http://localhost:5173';
    const response = await app.inject({
      method: 'OPTIONS',
      url: '/api/v1/auth/login',
      headers: {
        origin: frontendOrigin,
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'content-type,authorization',
      },
    });

    expect(response.statusCode).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe(frontendOrigin);
    expect(response.headers['access-control-allow-credentials']).toBe('true');
    expect(response.headers['access-control-allow-methods']).toContain('POST');
  });

  it('correctly reads client IP when routed through reverse proxy / Cloudflare tunnel (trustProxy: true)', async () => {
    const clientIp = '198.51.100.42';
    const response = await app.inject({
      method: 'GET',
      url: '/test-ip-proxy',
      headers: {
        'x-forwarded-for': clientIp,
      },
      remoteAddress: '127.0.0.1',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.ip).toBe(clientIp);
  });
});
