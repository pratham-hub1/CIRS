import { Module, Global } from '@nestjs/common';
import { TenancyService } from './tenancy.service';
import { CampusesController } from './campuses.controller';

@Global()
@Module({
  controllers: [CampusesController],
  providers: [TenancyService],
  exports: [TenancyService],
})
export class TenancyModule {}
