import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCaseMessageDto {
  @IsString()
  @IsNotEmpty()
  body!: string;
}
