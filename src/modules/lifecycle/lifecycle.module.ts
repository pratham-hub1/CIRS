import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { LifecycleService } from './lifecycle.service';
import { ScheduledJobsService } from './scheduled-jobs.service';
import { LifecycleController } from './lifecycle.controller';

@Module({
  imports: [PrismaModule, TenancyModule, NotificationsModule],
  controllers: [LifecycleController],
  providers: [LifecycleService, ScheduledJobsService],
  exports: [LifecycleService, ScheduledJobsService],
})
export class LifecycleModule {}
