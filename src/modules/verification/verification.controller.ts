import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { VerificationService } from './verification.service';
import { RequestInfoDto } from './dto/request-info.dto';
import { RejectClaimDto } from './dto/reject-claim.dto';
import { AddQuestionsDto } from './dto/add-questions.dto';
import { DecideAppealDto } from './dto/decide-appeal.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { ClaimStatus, Role } from '../../domain/enums';

@Roles(Role.ADMIN)
@Controller('admin')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get('claims')
  @HttpCode(HttpStatus.OK)
  async getClaims(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: ClaimStatus,
  ) {
    return this.verificationService.getClaims(user, status);
  }

  @Post('claims/:id/request-info')
  @HttpCode(HttpStatus.OK)
  async requestMoreInfo(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RequestInfoDto,
  ) {
    return this.verificationService.requestMoreInfo(user, id, dto);
  }

  @Post('claims/:id/approve')
  @HttpCode(HttpStatus.OK)
  async approveClaim(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.verificationService.approveClaim(user, id);
  }

  @Post('claims/:id/reject')
  @HttpCode(HttpStatus.OK)
  async rejectClaim(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RejectClaimDto,
  ) {
    return this.verificationService.rejectClaim(user, id, dto);
  }

  @Post('claims/:id/questions')
  @HttpCode(HttpStatus.CREATED)
  async addQuestions(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AddQuestionsDto,
  ) {
    return this.verificationService.addQuestions(user, id, dto);
  }

  @Post('appeals/:id/decide')
  @HttpCode(HttpStatus.OK)
  async decideAppeal(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: DecideAppealDto,
  ) {
    return this.verificationService.decideAppeal(user, id, dto);
  }
}
