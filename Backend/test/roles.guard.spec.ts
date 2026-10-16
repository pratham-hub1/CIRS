import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../src/modules/auth/guards/roles.guard';
import { Role } from '../src/domain/enums';
import { ROLES_KEY } from '../src/common/decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../src/common/decorators/public.decorator';

describe('RolesGuard (FR-3, INT-4)', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockContext(user?: any): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('allows access to public routes without checking roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return true;
      return undefined;
    });

    const ctx = createMockContext(null);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('fails closed and throws ForbiddenException if route has no access policy (INT-4)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation(() => undefined);

    const ctx = createMockContext({ role: Role.STUDENT });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('allows access when user role matches allowed roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === ROLES_KEY) return [Role.ADMIN];
      return undefined;
    });

    const ctx = createMockContext({ role: Role.ADMIN });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('rejects with 403 Forbidden when user role does not match allowed roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === ROLES_KEY) return [Role.ADMIN];
      return undefined;
    });

    const ctx = createMockContext({ role: Role.STUDENT });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('allows any authenticated user when role is AUTHENTICATED', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === ROLES_KEY) return ['AUTHENTICATED'];
      return undefined;
    });

    const ctx = createMockContext({ role: Role.STUDENT });
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
