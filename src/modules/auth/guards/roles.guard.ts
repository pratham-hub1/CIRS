import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, AllowedRole } from '../../../common/decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<AllowedRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      throw new ForbiddenException('Access denied: route has no access policy');
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthUser;

    if (!user) {
      throw new ForbiddenException('Access denied: user context missing');
    }

    if (requiredRoles.includes('AUTHENTICATED')) {
      return true;
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(
        `Forbidden: Role '${user.role}' lacks required permissions`,
      );
    }

    return true;
  }
}
