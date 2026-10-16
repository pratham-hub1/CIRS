import {
  Controller,
  Get,
  Post,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MatchingService } from './matching.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { Role } from '../../domain/enums';

@Controller()
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Roles('AUTHENTICATED')
  @Get('items/:caseId/matches')
  @HttpCode(HttpStatus.OK)
  async getMatchesForCase(
    @CurrentUser() user: AuthUser,
    @Param('caseId') caseId: string,
  ) {
    return this.matchingService.getMatchesForCase(user, caseId);
  }

  @Roles(Role.ADMIN)
  @Post('matches/:id/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmMatch(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.matchingService.confirmMatch(user, id);
  }

  @Roles(Role.ADMIN)
  @Post('matches/:id/dismiss')
  @HttpCode(HttpStatus.OK)
  async dismissMatch(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.matchingService.dismissMatch(user, id);
  }
}
