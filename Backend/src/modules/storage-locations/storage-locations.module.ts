import { Module } from '@nestjs/common';
import { StorageLocationsController } from './storage-locations.controller';

@Module({
  controllers: [StorageLocationsController],
})
export class StorageLocationsModule {}
