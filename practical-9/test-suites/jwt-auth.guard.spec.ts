import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../src/common/decorators/public.decorator';
import { UserStatus, Role } from '../src/domain/enums';

describe('JwtAuthGuard (Security Check - Issue 3)', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;
  let jwtService: any;
  let configService: any;
  let prisma: any;

  beforeEach(() => {
    reflector = new Reflector();
    jwtService = {
      verifyAsync: jest.fn(),
    };
    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'jwt.accessSecret') return 'test-access-secret-32-characters-min!';
        return null;
      }),
    };
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
    };
    guard = new JwtAuthGuard(reflector, jwtService, configService, prisma);
  });

  function createMockContext(headers: Record<string, string> = {}): {
    context: ExecutionContext;
    request: any;
  } {
    const request = { headers, user: null };
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
    return { context, request };
  }

  it('allows access to public routes without token', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const { context } = createMockContext({});

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('rejects unauthenticated requests to protected routes with 401', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const { context } = createMockContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    await expect(guard.canActivate(context)).rejects.toThrow('Authentication required');
  });

  it('rejects malformed authorization header with 401', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const { context } = createMockContext({ authorization: 'Basic 12345' });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    await expect(guard.canActivate(context)).rejects.toThrow('Authentication required');
  });

  it('rejects invalid or expired token with 401', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));
    const { context } = createMockContext({ authorization: 'Bearer expired-token' });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    await expect(guard.canActivate(context)).rejects.toThrow('Invalid or expired token');
  });

  it('rejects when user does not exist in database with 401', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    jwtService.verifyAsync.mockResolvedValue({ sub: 'user-deleted' });
    prisma.user.findUnique.mockResolvedValue(null);
    const { context } = createMockContext({ authorization: 'Bearer valid-token' });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    await expect(guard.canActivate(context)).rejects.toThrow('User account is invalid or disabled');
  });

  it('rejects when user status is DISABLED with 401', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    jwtService.verifyAsync.mockResolvedValue({ sub: 'user-disabled' });
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-disabled',
      email: 'disabled@gsfcuniversity.ac.in',
      status: UserStatus.DISABLED,
    });
    const { context } = createMockContext({ authorization: 'Bearer valid-token' });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    await expect(guard.canActivate(context)).rejects.toThrow('User account is invalid or disabled');
  });

  it('allows access and populates request.user for valid active token', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    jwtService.verifyAsync.mockResolvedValue({ sub: 'user-1' });
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'student@gsfcuniversity.ac.in',
      role: Role.STUDENT,
      campusId: 'campus-1',
      departmentId: 'dept-cse',
      status: UserStatus.ACTIVE,
    });
    const { context, request } = createMockContext({ authorization: 'Bearer valid-active-token' });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(request.user).toEqual({
      id: 'user-1',
      email: 'student@gsfcuniversity.ac.in',
      role: Role.STUDENT,
      campusId: 'campus-1',
      departmentId: 'dept-cse',
    });
  });
});
