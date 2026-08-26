import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ItemsService } from './items.service';
import { listQuerySchema, type ListQuery, type PaginatedItems } from './items.dto';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  /** GET /items?limit=20&cursor=... — one keyset-paginated page, newest first. */
  @Get()
  list(
    @Query(new ZodValidationPipe(listQuerySchema)) query: ListQuery,
  ): Promise<PaginatedItems> {
    return this.itemsService.list(query);
  }

  /** POST /items/seed { count } — dev helper to (re)populate the collection. */
  @Post('seed')
  seed(@Body('count') count?: number): Promise<{ inserted: number }> {
    const n = Number.isFinite(count) && (count as number) > 0 ? Math.min(Number(count), 5000) : 100;
    return this.itemsService.seed(n);
  }
}
