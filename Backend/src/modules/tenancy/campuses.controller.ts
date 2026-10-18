import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { TenancyService } from './tenancy.service';

@ApiTags('Campuses')
@Controller('campuses')
export class CampusesController {
  constructor(private readonly tenancyService: TenancyService) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'List all active campuses with departments for discovery and registration',
  })
  @ApiResponse({
    status: 200,
    description: 'List of registered campuses with departments',
  })
  async getCampuses() {
    return this.tenancyService.getPublicCampuses();
  }
}
