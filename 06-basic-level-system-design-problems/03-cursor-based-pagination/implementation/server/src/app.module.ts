import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { config } from './config';
import { ItemsModule } from './items/items.module';

@Module({
  imports: [MongooseModule.forRoot(config.MONGODB_URI), ItemsModule],
})
export class AppModule {}
