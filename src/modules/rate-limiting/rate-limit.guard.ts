import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  RATE_LIMIT_KEY,
  RateLimitOptions,
} from '../../common/decorators/rate-limit.decorator';
import { RateLimitService } from './rate-limit.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimitService: RateLimitService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options) {
      return true; // No rate limit configured for this route
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const user = request.user;
    const ip =
      request.ip ||
      request.headers['x-forwarded-for'] ||
      request.socket?.remoteAddress ||
      'unknown-ip';

    const clientId = user?.id ? `user:${user.id}` : `ip:${ip}`;
    const routeKey = `${context.getClass().name}:${context.getHandler().name}`;
    const rateLimitKey = `${clientId}:${routeKey}`;

    const result = this.rateLimitService.checkLimit(
      rateLimitKey,
      options.limit,
      options.ttlSeconds,
    );

    // Set standard RateLimit headers if response header method exists
    if (typeof response.header === 'function') {
      response.header('X-RateLimit-Limit', options.limit);
      response.header('X-RateLimit-Remaining', result.remaining);
      response.header(
        'X-RateLimit-Reset',
        Math.ceil(result.resetTime / 1000),
      );
    }

    if (!result.allowed) {
      this.logger.warn(
        `Rate limit exceeded for client '${clientId}' on route '${routeKey}'`,
      );

      // Record rate limit violation audit entry (FR-36)
      if (user?.id) {
        try {
          await this.prisma.auditLog.create({
            data: {
              actorId: user.id,
              action: 'RATE_LIMIT_EXCEEDED',
              targetType: 'Route',
              targetId: routeKey,
              after: {
                limit: options.limit,
                ttlSeconds: options.ttlSeconds,
                ip,
              },
            },
          });
        } catch (err) {
          this.logger.error('Failed to log rate limit violation audit row', err);
        }
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
