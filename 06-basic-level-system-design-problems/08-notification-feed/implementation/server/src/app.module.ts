import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { config } from './config';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [MongooseModule.forRoot(config.MONGODB_URI), NotificationsModule],
})
export class AppModule {}
