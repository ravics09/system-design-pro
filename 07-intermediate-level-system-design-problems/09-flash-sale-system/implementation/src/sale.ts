import type { Redis } from 'ioredis';

/**
 * Atomic reserve: check stock > 0 and decrement in ONE Lua step so the (N+1)th buyer can
 * never succeed — the hard anti-oversell guarantee. The reserved unit is recorded in a
 * per-item reservations ZSET scored by expiry, so an unpaid hold can be returned to stock.
 */
const RESERVE_LUA = `
local stock = tonumber(redis.call('GET', KEYS[1]) or '0')
if stock <= 0 then return -1 end
redis.call('DECR', KEYS[1])
redis.call('ZADD', KEYS[2], ARGV[2], ARGV[1])
return stock - 1
`;

/** Pure helper (unit-tested): given reservation entries and now, which ids are expired. */
export function reapable(entries: { id: string; expiresAt: number }[], now: number): string[] {
  return entries.filter((e) => e.expiresAt <= now).map((e) => e.id);
}

export class FlashSale {
  constructor(private readonly redis: Redis, private readonly reservationTtlMs: number) {}

  private stockKey(item: string) { return `stock:${item}`; }
  private resKey(item: string) { return `reservations:${item}`; }

  async init(item: string, stock: number): Promise<void> {
    await this.redis.set(this.stockKey(item), String(stock));
    await this.redis.del(this.resKey(item));
  }

  async remaining(item: string): Promise<number> {
    return Number((await this.redis.get(this.stockKey(item))) ?? 0);
  }

  /** Returns the reservationId on success, or null if sold out. */
  async reserve(item: string, reservationId: string, now = Date.now()): Promise<string | null> {
    const expiresAt = now + this.reservationTtlMs;
    const result = (await this.redis.eval(
      RESERVE_LUA,
      2,
      this.stockKey(item),
      this.resKey(item),
      reservationId,
      String(expiresAt),
    )) as number;
    return result < 0 ? null : reservationId;
  }

  /** Confirm a reservation (payment captured). ZREM returns 1 only if still valid. */
  async confirm(item: string, reservationId: string): Promise<boolean> {
    const removed = await this.redis.zrem(this.resKey(item), reservationId);
    return removed === 1;
  }

  /** Return expired (unpaid) reservations to the stock pool. Called by the reaper. */
  async reapExpired(item: string, now = Date.now()): Promise<number> {
    const expired = await this.redis.zrangebyscore(this.resKey(item), '-inf', now);
    if (expired.length === 0) return 0;
    const pipe = this.redis.multi();
    for (const id of expired) pipe.zrem(this.resKey(item), id);
    pipe.incrby(this.stockKey(item), expired.length); // return the held units
    await pipe.exec();
    return expired.length;
  }
}
