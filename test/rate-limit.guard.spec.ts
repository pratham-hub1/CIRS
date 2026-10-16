import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitGuard } from '../src/modules/rate-limiting/rate-limit.guard';
import { RateLimitService } from '../src/modules/rate-limiting/rate-limit.service';

describe('FR-36: RateLimitGuard & Throttling', () => {
  let guard: RateLimitGuard;
  let service: RateLimitService;
  let reflector: Reflector;
  let prismaMock: any;

  beforeEach(() => {
    service = new RateLimitService();
    reflector = new Reflector();
    prismaMock = {
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      },
    };
    guard = new RateLimitGuard(reflector, service, prismaMock);
  });

  const createMockContext = (
    userId?: string,
    ip = '127.0.0.1',
    options?: { limit: number; ttlSeconds: number },
  ): ExecutionContext => {
    const handler = () => {};
    const controller = class MockController {};

    if (options) {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(options);
    } else {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    }

    const req: any = {
      user: userId ? { id: userId } : undefined,
      ip,
      headers: {},
      socket: { remoteAddress: ip },
    };

    const res: any = {
      header: jest.fn(),
    };

    return {
      getHandler: () => handler,
      getClass: () => controller,
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
    } as any;
  };

  it('allows request when no @RateLimit() is declared', async () => {
    const context = createMockContext('user-1', '127.0.0.1');
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('allows requests within limit and sets response headers', async () => {
    const options = { limit: 3, ttlSeconds: 60 };
    const context = createMockContext('user-1', '127.0.0.1', options);

    // Hit 1
    const res1 = await guard.canActivate(context);
    expect(res1).toBe(true);

    // Hit 2
    const res2 = await guard.canActivate(context);
    expect(res2).toBe(true);

    // Hit 3 (Limit reached)
    const res3 = await guard.canActivate(context);
    expect(res3).toBe(true);
  });

  it('throws 429 Too Many Requests when rate limit is exceeded (FR-36)', async () => {
    const options = { limit: 2, ttlSeconds: 60 };
    const context = createMockContext('user-spam', '127.0.0.1', options);

    await guard.canActivate(context); // 1
    await guard.canActivate(context); // 2

    // 3rd hit should throw 429
    await expect(guard.canActivate(context)).rejects.toThrow(HttpException);
    try {
      await guard.canActivate(context);
    } catch (err: any) {
      expect(err.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    }

    // Violations are logged to audit log (FR-36 AC)
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: 'user-spam',
        action: 'RATE_LIMIT_EXCEEDED',
      }),
    });
  });

  it('rate limits are isolated per user', async () => {
    const options = { limit: 1, ttlSeconds: 60 };
    const contextUser1 = createMockContext('user-A', '127.0.0.1', options);
    const contextUser2 = createMockContext('user-B', '127.0.0.1', options);

    expect(await guard.canActivate(contextUser1)).toBe(true);
    // User 1 exceeds
    await expect(guard.canActivate(contextUser1)).rejects.toThrow(HttpException);

    // User 2 should still be allowed
    expect(await guard.canActivate(contextUser2)).toBe(true);
  });
});
