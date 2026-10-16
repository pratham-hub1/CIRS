import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class CreateSavedSearchDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsObject()
  @IsNotEmpty()
  criteria!: Record<string, any>;
}
