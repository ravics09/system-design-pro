export interface Route {
  prefix: string;
  target: string;
  auth?: boolean;
}

/** Longest-prefix match so `/orders/items` beats a shorter `/orders`. Pure + unit-tested. */
export function matchRoute(routes: Route[], path: string): Route | null {
  let best: Route | null = null;
  for (const r of routes) {
    const isMatch = path === r.prefix || path.startsWith(r.prefix + '/');
    if (isMatch && (!best || r.prefix.length > best.prefix.length)) best = r;
  }
  return best;
}

/** Rewrite the inbound path to the upstream path (strip the matched prefix). */
export function rewritePath(prefix: string, path: string): string {
  const rest = path.slice(prefix.length);
  return rest.startsWith('/') || rest === '' ? rest || '/' : '/' + rest;
}

/**
 * Token bucket rate limiter (pure, testable): capacity tokens, refilling `refillPerSec`.
 * Each request consumes one token; when empty, the request is limited.
 */
export class TokenBucket {
  private tokens: number;
  private last: number;
  constructor(private readonly capacity: number, private readonly refillPerSec: number, now = Date.now()) {
    this.tokens = capacity;
    this.last = now;
  }

  tryRemove(now = Date.now()): boolean {
    const elapsedSec = (now - this.last) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsedSec * this.refillPerSec);
    this.last = now;
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }
}

/** Per-key bucket registry (e.g., per client IP). */
export class RateLimiter {
  private buckets = new Map<string, TokenBucket>();
  constructor(private readonly capacity: number, private readonly refillPerSec: number) {}
  allow(key: string, now = Date.now()): boolean {
    let b = this.buckets.get(key);
    if (!b) {
      b = new TokenBucket(this.capacity, this.refillPerSec, now);
      this.buckets.set(key, b);
    }
    return b.tryRemove(now);
  }
}
