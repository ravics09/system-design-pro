import type { Response, NextFunction } from "express";
import { Redis } from "ioredis";
import { config } from "../config/index.js";
import type { AuthedRequest } from "../types/index.js";
import { TooManyRequestsError } from "../errors/httpErrors.js";

/**
 * A fixed-window rate limiter with a pluggable counter store.
 *
 * The distributed (Redis) store shares counts across all instances so the limit
 * is global, not per-process — see the Rate Limiting concept doc. In dev we fall
 * back to an in-memory store.
 */
interface CounterStore {
  /** Increment the counter for `key`, (re)setting its TTL, and return the new count. */
  hit(key: string, windowSeconds: number): Promise<number>;
}

class RedisCounterStore implements CounterStore {
  private readonly redis: Redis;
  constructor() {
    this.redis = new Redis(config.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 2 });
  }
  async hit(key: string, windowSeconds: number): Promise<number> {
    // INCR then set expiry only on first hit — atomic enough for fixed windows.
    const count = await this.redis.incr(key);
    if (count === 1) await this.redis.expire(key, windowSeconds);
    return count;
  }
}

class MemoryCounterStore implements CounterStore {
  private readonly map = new Map<string, { count: number; resetAt: number }>();
  async hit(key: string, windowSeconds: number): Promise<number> {
    const now = Date.now();
    const entry = this.map.get(key);
    if (!entry || entry.resetAt <= now) {
      this.map.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
      return 1;
    }
    entry.count += 1;
    return entry.count;
  }
}

const store: CounterStore =
  config.RATE_LIMIT_DRIVER === "redis" ? new RedisCounterStore() : new MemoryCounterStore();

/**
 * Build a rate-limiting middleware.
 * @param name    logical bucket name (keeps different limits from colliding)
 * @param limit   max requests allowed per window
 * @param windowSeconds  window length
 */
export function rateLimit(name: string, limit: number, windowSeconds: number) {
  return async (req: AuthedRequest, _res: Response, next: NextFunction): Promise<void> => {
    // Authenticated → key by user; anonymous → key by IP.
    const identity = req.user?.id ?? req.ip ?? "anonymous";
    const key = `ratelimit:${name}:${identity}`;

    const count = await store.hit(key, windowSeconds);
    if (count > limit) {
      throw new TooManyRequestsError("Rate limit exceeded", windowSeconds);
    }
    next();
  };
}
