import { Controller, Get, Post } from '@nestjs/common';
import { CacheService } from './cache.service';

@Controller('cache')
export class CacheController {
  constructor(private readonly cache: CacheService) {}

  @Get('health')
  health(): { status: string } {
    return { status: 'ok' };
  }

  /** Live cache metrics — hit ratio is the number that matters. */
  @Get('stats')
  stats() {
    return this.cache.stats();
  }

  @Get('keys')
  keys(): { keys: string[] } {
    return { keys: this.cache.keys() };
  }

  /** Flush the cache (and reset metrics) — watch the next reads miss again. */
  @Post('flush')
  flush() {
    this.cache.clear();
    return this.cache.stats();
  }
}
