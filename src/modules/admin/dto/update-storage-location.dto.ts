import { IsEnum, IsNotEmpty } from 'class-validator';
import { StorageLocationName } from '../../../domain/enums';

export class UpdateStorageLocationDto {
  @IsEnum(StorageLocationName)
  @IsNotEmpty()
  name: StorageLocationName;
}
