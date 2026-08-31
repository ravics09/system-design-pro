import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard, getUserId } from '../common/auth.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { createAddressSchema, type CreateAddressInput } from './addresses.dto';
import { AddressesService } from './addresses.service';

@Controller('addresses')
@UseGuards(AuthGuard)
export class AddressesController {
  constructor(private readonly addresses: AddressesService) {}

  @Get()
  list(@Req() req: Request) {
    return this.addresses.list(getUserId(req));
  }

  @Post()
  create(@Req() req: Request, @Body(new ZodValidationPipe(createAddressSchema)) body: CreateAddressInput) {
    return this.addresses.create(getUserId(req), body);
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string) {
    await this.addresses.remove(getUserId(req), id);
    return { ok: true };
  }
}
