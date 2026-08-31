/**
 * Sliding-window rate limiter keyed by client (IP). Keeps the timestamps of recent
 * events per key and allows a new one only if fewer than `max` fall inside the window.
 * In production this lives in a shared store (Redis) so limits hold across instances.
 */
export class SlidingWindowLimiter {
  private hits = new Map<string, number[]>();

  constructor(
    private readonly max: number,
    private readonly windowMs: number,
  ) {}

  allow(key: string, now = Date.now()): boolean {
    const cutoff = now - this.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((t) => t > cutoff);
    if (recent.length >= this.max) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    return true;
  }

  /** Remaining allowance in the current window (for a Retry-After style hint). */
  remaining(key: string, now = Date.now()): number {
    const cutoff = now - this.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((t) => t > cutoff);
    return Math.max(0, this.max - recent.length);
  }

  reset(): void {
    this.hits.clear();
  }
}
