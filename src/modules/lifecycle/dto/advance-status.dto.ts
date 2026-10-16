import { IsEnum, IsNotEmpty } from 'class-validator';
import { ItemStatus } from '../../../domain/enums';

export class AdvanceStatusDto {
  @IsEnum(ItemStatus)
  @IsNotEmpty()
  status: ItemStatus;
}
