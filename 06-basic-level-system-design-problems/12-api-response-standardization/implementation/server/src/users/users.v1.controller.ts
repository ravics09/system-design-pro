import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { UsersService } from './users.service';
import { DeprecationInterceptor } from '../common/deprecation.interceptor';

/**
 * v1 — DEPRECATED. Same underlying data, older shape ({ id, name }). The
 * DeprecationInterceptor advertises Deprecation/Sunset headers; clients should
 * migrate to v2. Note it calls the SAME UsersService as v2.
 */
@Controller({ path: 'users', version: '1' })
@UseInterceptors(DeprecationInterceptor)
export class UsersV1Controller {
  constructor(private readonly users: UsersService) {}

  @Get()
  findAll(): { id: string; name: string }[] {
    return this.users.findAll().map((u) => ({ id: u.id, name: `${u.firstName} ${u.lastName}` }));
  }
}
