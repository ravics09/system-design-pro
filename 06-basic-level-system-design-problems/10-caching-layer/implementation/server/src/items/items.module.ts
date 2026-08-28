import { Module } from '@nestjs/common';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { SlowStore } from './slow-store';

@Module({
  controllers: [ItemsController],
  providers: [ItemsService, SlowStore],
})
export class ItemsModule {}
