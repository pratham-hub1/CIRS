import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { CreateCaseMessageDto } from './dto/create-case-message.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { Role, ItemCategory, ItemStatus, ItemType } from '../../domain/enums';

@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Roles(Role.STUDENT, Role.FACULTY, Role.ADMIN)
  @RateLimit({ limit: 20, ttlSeconds: 3600 })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createItem(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateItemDto,
  ) {
    return this.itemsService.createItem(user, dto);
  }

  @Roles('AUTHENTICATED')
  @Get()
  @HttpCode(HttpStatus.OK)
  async getItems(
    @CurrentUser() user: AuthUser,
    @Query('category') category?: ItemCategory,
    @Query('status') status?: ItemStatus,
    @Query('type') type?: ItemType,
    @Query('search') search?: string,
  ) {
    return this.itemsService.getItems(user, { category, status, type, search });
  }

  @Roles('AUTHENTICATED')
  @Get('mine')
  @HttpCode(HttpStatus.OK)
  async getMyItems(@CurrentUser() user: AuthUser) {
    return this.itemsService.getMyItems(user);
  }

  @Roles('AUTHENTICATED')
  @Get(':caseId')
  @HttpCode(HttpStatus.OK)
  async getItemByCaseId(
    @CurrentUser() user: AuthUser,
    @Param('caseId') caseId: string,
  ) {
    return this.itemsService.getItemByCaseId(user, caseId);
  }

  @Roles('AUTHENTICATED')
  @Patch(':caseId')
  @HttpCode(HttpStatus.OK)
  async editItem(
    @CurrentUser() user: AuthUser,
    @Param('caseId') caseId: string,
    @Body() dto: UpdateItemDto,
  ) {
    return this.itemsService.editItem(user, caseId, dto);
  }

  @Roles('AUTHENTICATED')
  @Post(':caseId/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelItem(
    @CurrentUser() user: AuthUser,
    @Param('caseId') caseId: string,
  ) {
    return this.itemsService.cancelItem(user, caseId);
  }

  @Roles('AUTHENTICATED')
  @Post(':caseId/messages')
  @HttpCode(HttpStatus.CREATED)
  async addCaseMessage(
    @CurrentUser() user: AuthUser,
    @Param('caseId') caseId: string,
    @Body() dto: CreateCaseMessageDto,
  ) {
    return this.itemsService.addCaseMessage(user, caseId, dto.body);
  }

  @Roles('AUTHENTICATED')
  @Get(':caseId/messages')
  @HttpCode(HttpStatus.OK)
  async getCaseMessages(
    @CurrentUser() user: AuthUser,
    @Param('caseId') caseId: string,
  ) {
    return this.itemsService.getCaseMessages(user, caseId);
  }
}
