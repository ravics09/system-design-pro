import { Module } from '@nestjs/common';
import { CacheModule } from './cache/cache.module';
import { ItemsModule } from './items/items.module';

@Module({
  imports: [CacheModule, ItemsModule],
})
export class AppModule {}
