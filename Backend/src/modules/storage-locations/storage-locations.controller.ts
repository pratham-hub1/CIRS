import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { applyCampusScope } from '../../common/repositories/scoped.repository';

@Roles('AUTHENTICATED')
@Controller('storage-locations')
export class StorageLocationsController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List campus storage locations for found report dropdown (FR-33 / Authenticated).
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getStorageLocations(@CurrentUser() user: AuthUser) {
    const where = applyCampusScope(user.campusId, {});
    return this.prisma.storageLocation.findMany({
      where,
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });
  }
}
