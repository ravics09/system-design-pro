import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { config } from '../config';

/**
 * Per-user unread counter — the badge value.
 *
 * Keeping it as an O(1) counter (Redis in prod, in-memory in dev) avoids a
 * `countDocuments()` on every read. All notification mutations funnel through the
 * service, which keeps this counter in sync (incr on emit, decr/reset on read).
 */
@Injectable()
export class UnreadStore implements OnModuleDestroy {
  private readonly redis?: Redis;
  private readonly mem = new Map<string, number>();

  constructor() {
    if (config.UNREAD_DRIVER === 'redis') {
      this.redis = new Redis(config.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 2 });
    }
  }

  private key(userId: string): string {
    return `unread:${userId}`;
  }

  async incr(userId: string, by = 1): Promise<number> {
    if (this.redis) return this.redis.incrby(this.key(userId), by);
    const next = (this.mem.get(userId) ?? 0) + by;
    this.mem.set(userId, next);
    return next;
  }

  async decr(userId: string, by = 1): Promise<number> {
    if (this.redis) {
      const v = await this.redis.decrby(this.key(userId), by);
      if (v < 0) await this.redis.set(this.key(userId), '0');
      return Math.max(0, v);
    }
    const next = Math.max(0, (this.mem.get(userId) ?? 0) - by);
    this.mem.set(userId, next);
    return next;
  }

  async reset(userId: string): Promise<void> {
    if (this.redis) await this.redis.set(this.key(userId), '0');
    else this.mem.set(userId, 0);
  }

  async get(userId: string): Promise<number> {
    if (this.redis) return Number((await this.redis.get(this.key(userId))) ?? 0);
    return this.mem.get(userId) ?? 0;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) await this.redis.quit();
  }
}
