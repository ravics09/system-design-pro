import { Body, ConflictException, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { config } from '../config';
import { UniqueViolationError } from '../engine/indexes';
import { createIndexSchema, querySchema, type CreateIndexInput, type Query } from '../engine/types';
import { QueryService } from './query.service';

const seedSchema = z.object({ size: z.coerce.number().int().positive().max(2_000_000) });
type SeedInput = z.infer<typeof seedSchema>;

@Controller()
export class QueryController {
  constructor(private readonly svc: QueryService) {}

  /** Run a query and return the rows plus an EXPLAIN (index vs full scan, rows examined, ms). */
  @Post('query')
  query(@Body(new ZodValidationPipe(querySchema)) body: Query) {
    return this.svc.engine.run(body);
  }

  /** Replace the dataset with `size` freshly generated rows (rebuilds indexes). */
  @Post('seed')
  seed(@Body(new ZodValidationPipe(seedSchema)) body: SeedInput) {
    return this.svc.engine.seed(body.size);
  }

  @Get('indexes')
  listIndexes() {
    return this.svc.engine.listIndexes();
  }

  /** Create a hash / b-tree (optionally compound / unique) index. */
  @Post('indexes')
  createIndex(@Body(new ZodValidationPipe(createIndexSchema)) body: CreateIndexInput) {
    try {
      return this.svc.engine.createIndex(body);
    } catch (err) {
      if (err instanceof UniqueViolationError) throw new ConflictException(err.message);
      if (err instanceof Error && err.message.includes('already exists')) {
        throw new ConflictException(err.message);
      }
      throw err;
    }
  }

  @Delete('indexes/:name')
  dropIndex(@Param('name') name: string) {
    return { dropped: this.svc.engine.dropIndex(name) };
  }

  @Get('stats')
  stats() {
    return this.svc.engine.stats();
  }

  /** Reset to a fresh default dataset and drop all indexes. */
  @Post('reset')
  reset() {
    this.svc.engine.reset(config.SEED_SIZE);
    return { ok: true, ...this.svc.engine.stats() };
  }
}
