import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PostReturnFeedbackDto {
  @IsBoolean()
  @IsNotEmpty()
  isCorrectItem: boolean;

  @IsString()
  @IsOptional()
  comments?: string;
}
