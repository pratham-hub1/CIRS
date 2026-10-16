import {
  IsEnum,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ItemCategory, ItemStatus, ItemType } from '../../../domain/enums';

export class SearchQueryDto {
  @IsString()
  @IsOptional()
  q?: string;

  @IsEnum(ItemCategory)
  @IsOptional()
  category?: ItemCategory;

  @IsEnum(ItemStatus)
  @IsOptional()
  status?: ItemStatus;

  @IsEnum(ItemType)
  @IsOptional()
  type?: ItemType;

  @IsString()
  @IsOptional()
  location?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit: number = 20;

  @IsString()
  @IsOptional()
  cursor?: string;
}
