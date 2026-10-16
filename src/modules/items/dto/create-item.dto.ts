import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ItemCategory, ItemType } from '../../../domain/enums';

export class CreateItemDto {
  @IsEnum(ItemType)
  @IsNotEmpty()
  type!: ItemType;

  @IsString()
  @IsNotEmpty()
  itemName!: string;

  @IsEnum(ItemCategory)
  @IsNotEmpty()
  category!: ItemCategory;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  colour!: string;

  @IsString()
  @IsNotEmpty()
  brand!: string;

  @IsString()
  @IsNotEmpty()
  identifyingMarks!: string;

  @IsString()
  @IsOptional()
  serialNumber?: string;

  // LOST specific fields (INV-DM-6)
  @IsDateString()
  @IsOptional()
  dateLost?: string;

  @IsString()
  @IsOptional()
  lastKnownLocation?: string;

  // FOUND specific fields (INV-DM-6)
  @IsDateString()
  @IsOptional()
  dateFound?: string;

  @IsString()
  @IsOptional()
  foundLocation?: string;

  @IsString()
  @IsOptional()
  storageLocationId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}
