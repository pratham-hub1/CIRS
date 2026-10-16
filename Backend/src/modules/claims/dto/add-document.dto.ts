import { IsNotEmpty, IsString } from 'class-validator';

export class AddDocumentDto {
  @IsString()
  @IsNotEmpty()
  url!: string;

  @IsString()
  @IsNotEmpty()
  docType!: string;
}
