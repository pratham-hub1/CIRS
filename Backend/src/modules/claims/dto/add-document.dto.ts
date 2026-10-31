import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddDocumentDto {
  @IsString()
  @IsOptional()
  fileId?: string;

  @IsString()
  @IsOptional()
  url?: string;

  @IsString()
  @IsNotEmpty()
  docType!: string;
}
