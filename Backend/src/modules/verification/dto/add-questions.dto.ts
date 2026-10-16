import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class AddQuestionsDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  questions!: string[];
}
