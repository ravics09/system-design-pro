import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { UrlsService } from './urls.service';
import { createUrlSchema, type CreateUrlInput, type UrlView } from './urls.dto';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

/** Write/manage API. Mounted under /api/urls so it never clashes with GET /:code. */
@Controller('api/urls')
export class UrlsController {
  constructor(private readonly urlsService: UrlsService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(createUrlSchema)) body: CreateUrlInput,
  ): Promise<UrlView> {
    return this.urlsService.create(body);
  }

  @Get()
  list(@Query('ownerId') ownerId?: string): Promise<UrlView[]> {
    return this.urlsService.listByOwner(ownerId ?? '');
  }

  @Delete(':code')
  async disable(
    @Param('code') code: string,
    @Query('ownerId') ownerId?: string,
  ): Promise<{ ok: true }> {
    await this.urlsService.disable(code, ownerId ?? '');
    return { ok: true };
  }
}
