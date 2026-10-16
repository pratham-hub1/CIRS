import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AppealStatus } from '../../../domain/enums';

export class DecideAppealDto {
  @IsEnum(AppealStatus)
  @IsNotEmpty()
  status!: AppealStatus; // ACCEPTED or REJECTED

  @IsString()
  @IsOptional()
  decisionReason?: string;
}
