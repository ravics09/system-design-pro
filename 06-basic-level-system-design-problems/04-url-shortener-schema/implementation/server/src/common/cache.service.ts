import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { config } from '../config';

/**
 * A tiny cache abstraction used by the redirect (read) path for cache-aside.
 *
 * - `redis`  → shared cache across instances (production).
 * - `memory` → per-process cache (dev/tests), so the app runs without Redis.
 *
 * Negative lookups (unknown codes) are cached briefly by storing a sentinel, to
 * blunt cache penetration from floods of bogus codes.
 */
@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly redis?: Redis;
  private readonly mem = new Map<string, { value: string; expiresAt: number }>();

  constructor() {
    if (config.CACHE_DRIVER === 'redis') {
      this.redis = new Redis(config.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 2 });
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.redis) return this.redis.get(key);
    const entry = this.mem.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.mem.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds = config.CACHE_TTL_SECONDS): Promise<void> {
    if (this.redis) {
      await this.redis.set(key, value, 'EX', ttlSeconds);
      return;
    }
    this.mem.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async del(key: string): Promise<void> {
    if (this.redis) {
      await this.redis.del(key);
      return;
    }
    this.mem.delete(key);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) await this.redis.quit();
  }
}
