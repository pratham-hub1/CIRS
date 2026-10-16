import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateAppealDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Reason must be at least 10 characters long' })
  reason!: string;
}
