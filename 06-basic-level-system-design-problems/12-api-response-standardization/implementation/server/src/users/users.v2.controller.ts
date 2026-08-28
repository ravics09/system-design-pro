import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UsersService, type User } from './users.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { createUserSchema, type CreateUserInput } from './users.dto';
import { Paginated } from '../common/envelope';

/**
 * v2 — CURRENT. Richer shape ({ id, firstName, lastName, email }), pagination
 * meta on the list, create with validation, and a trace-propagation demo. Same
 * UsersService as v1 — only the presentation differs.
 */
@Controller({ path: 'users', version: '2' })
export class UsersV2Controller {
  constructor(private readonly users: UsersService) {}

  @Get()
  findAll(): Paginated<User> {
    const items = this.users.findAll();
    return new Paginated(items, { nextCursor: null, hasMore: false, limit: items.length });
  }

  /** Declared before ':id' so it isn't captured as an id. */
  @Get('trace-demo')
  traceDemo() {
    return this.users.traceDemo();
  }

  @Get(':id')
  findOne(@Param('id') id: string): User {
    return this.users.findOne(id); // throws 404 USER_NOT_FOUND → standard error envelope
  }

  @Post()
  create(@Body(new ZodValidationPipe(createUserSchema)) body: CreateUserInput): User {
    return this.users.create(body);
  }
}
