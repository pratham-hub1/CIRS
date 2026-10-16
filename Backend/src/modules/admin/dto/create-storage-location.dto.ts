import { IsEnum, IsNotEmpty } from 'class-validator';
import { StorageLocationName } from '../../../domain/enums';

export class CreateStorageLocationDto {
  @IsEnum(StorageLocationName)
  @IsNotEmpty()
  name: StorageLocationName;
}
