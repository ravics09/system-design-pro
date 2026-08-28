import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { config } from './config';
import { UsersModule } from './users/users.module';
import { FriendshipsModule } from './friendships/friendships.module';

@Module({
  imports: [MongooseModule.forRoot(config.MONGODB_URI), UsersModule, FriendshipsModule],
})
export class AppModule {}
