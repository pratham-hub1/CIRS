import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RequestInfoDto {
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  questions?: string[];
}
