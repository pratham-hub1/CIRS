import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';
import { JwtPayload, AuthUser } from '../../../common/interfaces/auth-user.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { UserStatus } from '../../../domain/enums';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    const token = this.extractTokenFromHeader(authHeader);

    if (!token) {
      if (isPublic) {
        return true;
      }
      throw new UnauthorizedException('Authentication required');
    }

    try {
      const secret = this.configService.get<string>('jwt.accessSecret');
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret,
      });

      // Verify user exists and is active
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          role: true,
          campusId: true,
          departmentId: true,
          status: true,
        },
      });

      if (!user || user.status === UserStatus.DISABLED) {
        throw new UnauthorizedException('User account is invalid or disabled');
      }

      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        role: user.role,
        campusId: user.campusId,
        departmentId: user.departmentId,
      };

      request.user = authUser;
      return true;
    } catch (error) {
      if (isPublic) {
        return true;
      }
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader) {
      return null;
    }
    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      return null;
    }
    return token.trim();
  }
}
