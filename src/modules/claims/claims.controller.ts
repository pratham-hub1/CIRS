import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { SubmitAnswersDto } from './dto/submit-answers.dto';
import { CreateAppealDto } from './dto/create-appeal.dto';
import { AddDocumentDto } from './dto/add-document.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { Role } from '../../domain/enums';

@Controller()
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Roles(Role.STUDENT, Role.FACULTY)
  @RateLimit({ limit: 20, ttlSeconds: 3600 })
  @Post('items/:caseId/claims')
  @HttpCode(HttpStatus.CREATED)
  async createClaim(
    @CurrentUser() user: AuthUser,
    @Param('caseId') caseId: string,
    @Body() dto: CreateClaimDto,
  ) {
    return this.claimsService.createClaim(user, caseId, dto);
  }

  @Roles(Role.STUDENT, Role.FACULTY)
  @Get('claims/mine')
  @HttpCode(HttpStatus.OK)
  async getMyClaims(@CurrentUser() user: AuthUser) {
    return this.claimsService.getMyClaims(user);
  }

  @Roles('AUTHENTICATED')
  @Get('claims/:id')
  @HttpCode(HttpStatus.OK)
  async getClaimById(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.claimsService.getClaimById(user, id);
  }

  @Roles('AUTHENTICATED')
  @Post('claims/:id/withdraw')
  @HttpCode(HttpStatus.OK)
  async withdrawClaim(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.claimsService.withdrawClaim(user, id);
  }

  @Roles('AUTHENTICATED')
  @Post('claims/:id/answers')
  @HttpCode(HttpStatus.OK)
  async submitAnswers(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: SubmitAnswersDto,
  ) {
    return this.claimsService.submitAnswers(user, id, dto);
  }

  @Roles('AUTHENTICATED')
  @Post('claims/:id/documents')
  @HttpCode(HttpStatus.CREATED)
  async addDocument(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AddDocumentDto,
  ) {
    return this.claimsService.addDocument(user, id, dto);
  }

  @Roles('AUTHENTICATED')
  @Post('claims/:id/appeals')
  @HttpCode(HttpStatus.CREATED)
  async createAppeal(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateAppealDto,
  ) {
    return this.claimsService.createAppeal(user, id, dto);
  }
}
