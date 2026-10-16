import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuditService } from '../audit/audit.service';
import { CreateStorageLocationDto } from './dto/create-storage-location.dto';
import { UpdateStorageLocationDto } from './dto/update-storage-location.dto';
import { AdminItemsQueryDto } from './dto/admin-items-query.dto';
import { AuditLogQueryDto } from '../audit/dto/audit-log-query.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { Role } from '../../domain/enums';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * List all cases across campus (FR-33).
   */
  @Roles(Role.ADMIN)
  @Get('items')
  @HttpCode(HttpStatus.OK)
  async getItems(
    @CurrentUser() adminUser: AuthUser,
    @Query() query: AdminItemsQueryDto,
  ) {
    return this.adminService.getItems(adminUser, query);
  }

  /**
   * List storage locations in campus (FR-33).
   */
  @Roles(Role.ADMIN)
  @Get('storage-locations')
  @HttpCode(HttpStatus.OK)
  async getStorageLocations(@CurrentUser() adminUser: AuthUser) {
    return this.adminService.getStorageLocations(adminUser);
  }

  /**
   * Create storage location (FR-33).
   */
  @Roles(Role.ADMIN)
  @Post('storage-locations')
  @HttpCode(HttpStatus.CREATED)
  async createStorageLocation(
    @CurrentUser() adminUser: AuthUser,
    @Body() dto: CreateStorageLocationDto,
  ) {
    return this.adminService.createStorageLocation(adminUser, dto);
  }

  /**
   * Update storage location (FR-33).
   */
  @Roles(Role.ADMIN)
  @Patch('storage-locations/:id')
  @HttpCode(HttpStatus.OK)
  async updateStorageLocation(
    @CurrentUser() adminUser: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateStorageLocationDto,
  ) {
    return this.adminService.updateStorageLocation(adminUser, id, dto);
  }

  /**
   * Compute analytics from source data (FR-34).
   */
  @Roles(Role.ADMIN)
  @Get('analytics')
  @HttpCode(HttpStatus.OK)
  async getAnalytics(
    @CurrentUser() adminUser: AuthUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getAnalytics(adminUser, { startDate, endDate });
  }

  /**
   * Query append-only audit trail (FR-37, INT-8, INV-DM-8).
   */
  @Roles(Role.ADMIN)
  @Get('audit-log')
  @HttpCode(HttpStatus.OK)
  async getAuditLog(
    @CurrentUser() adminUser: AuthUser,
    @Query() query: AuditLogQueryDto,
  ) {
    return this.auditService.getAuditLogs(adminUser, query);
  }
}
