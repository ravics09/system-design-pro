/**
 * Pure token-bucket refill math (mirrors the Redis Lua limiter): given the stored token count
 * and timestamp, compute tokens now and whether a request of `cost` is allowed. Unit-tested.
 */
export function refillAndConsume(
  tokens: number,
  lastMs: number,
  now: number,
  refillPerSec: number,
  capacity: number,
  cost = 1,
): { allowed: boolean; tokens: number } {
  const elapsedSec = Math.max(0, (now - lastMs) / 1000);
  let t = Math.min(capacity, tokens + elapsedSec * refillPerSec);
  if (t >= cost) return { allowed: true, tokens: t - cost };
  return { allowed: false, tokens: t };
}

/** Deterministic cache key for an upstream resource + query → single-flight + caching share it. */
export function cacheKey(resource: string, query: Record<string, unknown>): string {
  const qs = Object.keys(query).sort().map((k) => `${k}=${query[k]}`).join('&');
  return `proxy:${resource}${qs ? `?${qs}` : ''}`;
}
