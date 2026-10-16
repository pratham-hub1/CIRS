import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { CreateSavedSearchDto } from './dto/create-saved-search.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';

@Roles('AUTHENTICATED')
@Controller()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('feed')
  @HttpCode(HttpStatus.OK)
  async getCommunityFeed(
    @CurrentUser() user: AuthUser,
    @Query() query: SearchQueryDto,
  ) {
    return this.searchService.getCommunityFeed(user, query);
  }

  @Post('saved-searches')
  @HttpCode(HttpStatus.CREATED)
  async createSavedSearch(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateSavedSearchDto,
  ) {
    return this.searchService.createSavedSearch(user, dto);
  }

  @Get('saved-searches')
  @HttpCode(HttpStatus.OK)
  async getSavedSearches(@CurrentUser() user: AuthUser) {
    return this.searchService.getSavedSearches(user);
  }

  @Delete('saved-searches/:id')
  @HttpCode(HttpStatus.OK)
  async deleteSavedSearch(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.searchService.deleteSavedSearch(user, id);
  }
}
