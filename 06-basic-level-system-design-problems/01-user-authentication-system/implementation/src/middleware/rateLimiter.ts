import type { Request, Response, NextFunction } from "express";
import { Redis } from "ioredis";
import { config } from "../config/index.js";
import { TooManyRequestsError } from "../errors/httpErrors.js";

/**
 * Fixed-window rate limiter with a pluggable counter store.
 *
 * Auth endpoints are prime targets for brute force / credential stuffing. In a
 * multi-instance deployment the counter must be SHARED (Redis) so the limit is
 * global, not per-process. In dev we fall back to an in-memory store.
 */
interface CounterStore {
  hit(key: string, windowSeconds: number): Promise<number>;
}

class RedisCounterStore implements CounterStore {
  private readonly redis: Redis;
  constructor() {
    this.redis = new Redis(config.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 2 });
  }
  async hit(key: string, windowSeconds: number): Promise<number> {
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

/** How a request maps to a rate-limit identity. */
type KeyStrategy = "ip" | "ip-email";

/**
 * Build a rate-limiting middleware.
 * @param name          logical bucket (keeps different limits from colliding)
 * @param limit         max requests per window
 * @param windowSeconds window length
 * @param strategy      "ip" (blunt) or "ip-email" (targeted login protection)
 */
export function rateLimit(
  name: string,
  limit: number,
  windowSeconds: number,
  strategy: KeyStrategy = "ip",
) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const ip = req.ip ?? "unknown";
    let identity = ip;
    if (strategy === "ip-email") {
      const email = typeof req.body?.email === "string" ? req.body.email.toLowerCase() : "none";
      identity = `${ip}:${email}`;
    }

    const key = `ratelimit:${name}:${identity}`;
    const count = await store.hit(key, windowSeconds);
    if (count > limit) {
      throw new TooManyRequestsError("Too many requests, slow down", windowSeconds);
    }
    next();
  };
}
