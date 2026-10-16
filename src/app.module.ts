import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { configuration } from './common/config/configuration';
import { PrismaModule } from './modules/prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { TenancyModule } from './modules/tenancy/tenancy.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { FilesModule } from './modules/files/files.module';
import { ItemsModule } from './modules/items/items.module';
import { SearchModule } from './modules/search/search.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { MatchingModule } from './modules/matching/matching.module';
import { ClaimsModule } from './modules/claims/claims.module';
import { VerificationModule } from './modules/verification/verification.module';
import { LifecycleModule } from './modules/lifecycle/lifecycle.module';
import { APP_GUARD } from '@nestjs/core';
import { AuditModule } from './modules/audit/audit.module';
import { AdminModule } from './modules/admin/admin.module';
import { RateLimitingModule } from './modules/rate-limiting/rate-limiting.module';
import { RateLimitGuard } from './modules/rate-limiting/rate-limit.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  singleLine: true,
                },
              }
            : undefined,
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
      },
    }),
    PrismaModule,
    TenancyModule,
    AuthModule,
    UsersModule,
    FilesModule,
    ItemsModule,
    SearchModule,
    NotificationsModule,
    MatchingModule,
    ClaimsModule,
    VerificationModule,
    LifecycleModule,
    AuditModule,
    AdminModule,
    RateLimitingModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class AppModule {}
