import { Controller, Get, Post } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('health')
  health(): { status: string } {
    return { status: 'ok' };
  }

  @Get()
  list() {
    return this.users.list();
  }

  @Post('seed')
  seed() {
    return this.users.seed();
  }
}
