import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { ItemCategory } from '../../../domain/enums';

export class UpdateItemDto {
  @IsString()
  @IsOptional()
  itemName?: string;

  @IsEnum(ItemCategory)
  @IsOptional()
  category?: ItemCategory;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  colour?: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  identifyingMarks?: string;

  @IsString()
  @IsOptional()
  serialNumber?: string;

  @IsString()
  @IsOptional()
  lastKnownLocation?: string;

  @IsString()
  @IsOptional()
  foundLocation?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}
