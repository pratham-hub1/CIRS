import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class HandoverDto {
  @IsBoolean()
  @IsOptional()
  override?: boolean;

  @IsString()
  @IsOptional()
  overrideReason?: string;
}
