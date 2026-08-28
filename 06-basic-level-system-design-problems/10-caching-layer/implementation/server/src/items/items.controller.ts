import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ItemsService } from './items.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { updateItemSchema, type UpdateItemInput } from './items.dto';

@Controller('items')
export class ItemsController {
  constructor(private readonly items: ItemsService) {}

  @Get()
  list() {
    return this.items.list();
  }

  /** Debug: how many times the origin was actually read (proves single-flight). */
  @Get('debug/loads')
  loads() {
    return this.items.loads();
  }

  @Post('seed')
  seed() {
    return this.items.reset();
  }

  /** Cache-aside read → { data, cached, ms }. */
  @Get(':id')
  get(@Param('id') id: string) {
    return this.items.getItem(id);
  }

  /** Write-through update (keeps the cache fresh). */
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateItemSchema)) body: UpdateItemInput,
  ) {
    return this.items.updateItem(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.items.deleteItem(id);
    return { ok: true };
  }
}
