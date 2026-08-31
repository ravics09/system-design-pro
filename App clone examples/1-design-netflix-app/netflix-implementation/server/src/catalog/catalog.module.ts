import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { OmdbService } from './omdb.service';

@Module({
  controllers: [CatalogController],
  providers: [OmdbService],
  exports: [OmdbService],
})
export class CatalogModule {}
