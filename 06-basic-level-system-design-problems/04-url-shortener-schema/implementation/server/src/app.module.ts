import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { config } from './config';
import { UrlsModule } from './urls/urls.module';

@Module({
  imports: [MongooseModule.forRoot(config.MONGODB_URI), UrlsModule],
})
export class AppModule {}
