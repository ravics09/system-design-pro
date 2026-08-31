import type { Redis } from 'ioredis';

/**
 * Presence as self-healing soft state. We keep a Redis sorted set `online` whose score is
 * each user's lease-expiry timestamp (ms). A heartbeat renews the lease; if heartbeats stop,
 * the entry is simply past `now` and treated as offline (and lazily reaped). This avoids the
 * "stuck online ghost" problem of a boolean flag that relies on an unreliable disconnect event.
 */
const ONLINE_KEY = 'online';
const LASTSEEN_KEY = 'lastseen';

/** Pure helper (unit-tested without Redis): split members into online vs expired given `now`. */
export function partitionByExpiry(
  members: { member: string; expiresAt: number }[],
  now: number,
): { online: string[]; expired: string[] } {
  const online: string[] = [];
  const expired: string[] = [];
  for (const m of members) (m.expiresAt > now ? online : expired).push(m.member);
  return { online, expired };
}

export class PresenceStore {
  constructor(private readonly redis: Redis, private readonly ttlS: number) {}

  async heartbeat(userId: string, now = Date.now()): Promise<void> {
    const expiresAt = now + this.ttlS * 1000;
    await this.redis
      .multi()
      .zadd(ONLINE_KEY, expiresAt, userId)
      .hset(LASTSEEN_KEY, userId, String(now))
      .exec();
  }

  async isOnline(userId: string, now = Date.now()): Promise<boolean> {
    const score = await this.redis.zscore(ONLINE_KEY, userId);
    return score != null && Number(score) > now;
  }

  async status(userId: string, now = Date.now()): Promise<{ userId: string; online: boolean; lastSeen: number | null }> {
    const [score, last] = await Promise.all([
      this.redis.zscore(ONLINE_KEY, userId),
      this.redis.hget(LASTSEEN_KEY, userId),
    ]);
    return { userId, online: score != null && Number(score) > now, lastSeen: last ? Number(last) : null };
  }

  /** Currently-online users. Also lazily reaps expired entries (no cron needed). */
  async listOnline(now = Date.now()): Promise<string[]> {
    await this.redis.zremrangebyscore(ONLINE_KEY, '-inf', now);
    return this.redis.zrangebyscore(ONLINE_KEY, now, '+inf');
  }

  async onlineCount(now = Date.now()): Promise<number> {
    return this.redis.zcount(ONLINE_KEY, now, '+inf');
  }

  /** Presence for a specific friend list (the common feed query). */
  async statusFor(userIds: string[], now = Date.now()): Promise<Record<string, boolean>> {
    if (userIds.length === 0) return {};
    const pipe = this.redis.pipeline();
    for (const id of userIds) pipe.zscore(ONLINE_KEY, id);
    const res = await pipe.exec();
    const out: Record<string, boolean> = {};
    userIds.forEach((id, i) => {
      const score = res?.[i]?.[1] as string | null;
      out[id] = score != null && Number(score) > now;
    });
    return out;
  }
}
