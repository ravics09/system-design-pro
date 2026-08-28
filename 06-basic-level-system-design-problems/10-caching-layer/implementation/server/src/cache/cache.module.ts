import { Global, Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CacheController } from './cache.controller';

/** Global so any feature module can inject the shared CacheService. */
@Global()
@Module({
  controllers: [CacheController],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
