import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard, getUserId } from '../common/auth.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { createProfileSchema, type CreateProfileInput } from './profiles.dto';
import { ProfilesService } from './profiles.service';

@Controller('profiles')
@UseGuards(AuthGuard)
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  @Get()
  list(@Req() req: Request) {
    return this.profiles.list(getUserId(req));
  }

  @Post()
  create(@Req() req: Request, @Body(new ZodValidationPipe(createProfileSchema)) body: CreateProfileInput) {
    return this.profiles.create(getUserId(req), body);
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string) {
    await this.profiles.remove(getUserId(req), id);
    return { ok: true };
  }
}
