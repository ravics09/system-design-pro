import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Friendship, FriendshipSchema } from './friendship.schema';
import { FriendshipsService } from './friendships.service';
import { FriendshipsController } from './friendships.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Friendship.name, schema: FriendshipSchema }]),
    UsersModule,
  ],
  controllers: [FriendshipsController],
  providers: [FriendshipsService],
})
export class FriendshipsModule {}
