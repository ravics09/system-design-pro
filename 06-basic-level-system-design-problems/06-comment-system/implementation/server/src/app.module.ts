import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { config } from './config';
import { CommentsModule } from './comments/comments.module';

@Module({
  imports: [MongooseModule.forRoot(config.MONGODB_URI), CommentsModule],
})
export class AppModule {}
