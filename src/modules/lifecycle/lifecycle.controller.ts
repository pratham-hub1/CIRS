import {
  Controller,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LifecycleService } from './lifecycle.service';
import { AdvanceStatusDto } from './dto/advance-status.dto';
import { RedeemTokenDto } from './dto/redeem-token.dto';
import { HandoverDto } from './dto/handover.dto';
import { PostReturnFeedbackDto } from './dto/post-return-feedback.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { Role } from '../../domain/enums';

@Controller()
export class LifecycleController {
  constructor(private readonly lifecycleService: LifecycleService) {}

  /**
   * Advance item status via state machine (FR-22).
   */
  @Roles(Role.ADMIN)
  @Post('admin/items/:caseId/status')
  @HttpCode(HttpStatus.OK)
  async advanceStatus(
    @CurrentUser() adminUser: AuthUser,
    @Param('caseId') caseId: string,
    @Body() dto: AdvanceStatusDto,
  ) {
    return this.lifecycleService.advanceStatus(caseId, dto, adminUser);
  }

  /**
   * Mark item ready for collection + notify (FR-23).
   */
  @Roles(Role.ADMIN)
  @Post('admin/items/:caseId/ready')
  @HttpCode(HttpStatus.OK)
  async markReadyForCollection(
    @CurrentUser() adminUser: AuthUser,
    @Param('caseId') caseId: string,
  ) {
    return this.lifecycleService.markReadyForCollection(caseId, adminUser);
  }

  /**
   * Staff-side handover (FR-24).
   */
  @Roles(Role.ADMIN)
  @Post('admin/items/:caseId/handover')
  @HttpCode(HttpStatus.OK)
  async staffHandover(
    @CurrentUser() adminUser: AuthUser,
    @Param('caseId') caseId: string,
    @Body() dto: HandoverDto,
  ) {
    return this.lifecycleService.staffHandover(caseId, dto, adminUser);
  }

  /**
   * User-side handover confirmation (FR-24).
   */
  @Roles(Role.STUDENT, Role.FACULTY, Role.ADMIN)
  @Post('items/:caseId/confirm-receipt')
  @HttpCode(HttpStatus.OK)
  async confirmReceipt(
    @CurrentUser() user: AuthUser,
    @Param('caseId') caseId: string,
  ) {
    return this.lifecycleService.confirmReceipt(caseId, user);
  }

  /**
   * Redeem collection token (single-use) (FR-23).
   */
  @Roles(Role.ADMIN)
  @Post('claims/:id/redeem')
  @HttpCode(HttpStatus.OK)
  async redeemToken(
    @CurrentUser() adminUser: AuthUser,
    @Param('id') claimId: string,
    @Body() dto: RedeemTokenDto,
  ) {
    return this.lifecycleService.redeemToken(claimId, dto, adminUser);
  }

  /**
   * Post-return feedback (FR-25).
   */
  @Roles(Role.STUDENT, Role.FACULTY, Role.ADMIN)
  @Post('claims/:id/post-return-feedback')
  @HttpCode(HttpStatus.OK)
  async postReturnFeedback(
    @CurrentUser() user: AuthUser,
    @Param('id') claimId: string,
    @Body() dto: PostReturnFeedbackDto,
  ) {
    return this.lifecycleService.postReturnFeedback(claimId, dto, user);
  }

  /**
   * Archive case (FR-26).
   */
  @Roles(Role.ADMIN)
  @Post('admin/items/:caseId/archive')
  @HttpCode(HttpStatus.OK)
  async archiveItem(
    @CurrentUser() adminUser: AuthUser,
    @Param('caseId') caseId: string,
  ) {
    return this.lifecycleService.archiveItem(caseId, adminUser);
  }

  /**
   * Mark unclaimed/disposed (FR-27).
   */
  @Roles(Role.ADMIN)
  @Post('admin/items/:caseId/unclaimed')
  @HttpCode(HttpStatus.OK)
  async markUnclaimed(
    @CurrentUser() adminUser: AuthUser,
    @Param('caseId') caseId: string,
  ) {
    return this.lifecycleService.markUnclaimed(caseId, adminUser);
  }
}
