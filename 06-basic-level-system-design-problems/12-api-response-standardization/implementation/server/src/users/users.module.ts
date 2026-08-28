import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersV1Controller } from './users.v1.controller';
import { UsersV2Controller } from './users.v2.controller';

@Module({
  controllers: [UsersV1Controller, UsersV2Controller],
  providers: [UsersService],
})
export class UsersModule {}
