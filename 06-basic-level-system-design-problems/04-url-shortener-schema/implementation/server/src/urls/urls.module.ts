import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Url, UrlSchema } from './url.schema';
import { UrlsService } from './urls.service';
import { UrlsController } from './urls.controller';
import { RedirectService } from '../redirect/redirect.service';
import { RedirectController } from '../redirect/redirect.controller';
import { CounterModule } from '../counter/counter.module';
import { CacheService } from '../common/cache.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Url.name, schema: UrlSchema }]),
    CounterModule,
  ],
  controllers: [UrlsController, RedirectController],
  providers: [UrlsService, RedirectService, CacheService],
})
export class UrlsModule {}
