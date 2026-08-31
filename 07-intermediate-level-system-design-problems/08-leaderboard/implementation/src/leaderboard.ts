import type { Redis } from 'ioredis';

export interface Entry {
  rank: number;
  userId: string;
  score: number;
}

/**
 * Tie-break helper: pack (score, timestamp) into a single sortable number so that a higher
 * score always wins, and among equal scores the *earlier* achiever ranks higher. The low
 * 9 digits hold an inverted "seconds since 2020" tiebreak (< 1e9, so it can never overcome
 * a 1-point score difference). This keeps the composite within the double's 2^53 safe range
 * for scores up to ~9 million.
 */
const EPOCH_S = 1_577_836_800; // 2020-01-01T00:00:00Z in seconds
const TS_SPAN = 1e9; // seconds-since-2020 stays < 1e9 until ~2051
export function compositeScore(score: number, timestampMs: number): number {
  const sec = Math.max(0, Math.floor(timestampMs / 1000) - EPOCH_S);
  return score * TS_SPAN + (TS_SPAN - 1 - sec);
}
export function rawScoreFromComposite(composite: number): number {
  return Math.floor(composite / TS_SPAN);
}

export class Leaderboard {
  constructor(private readonly redis: Redis) {}

  private key(board: string): string {
    return `lb:${board}`;
  }

  /** Set an absolute score with earlier-wins tie-breaking. O(log n). */
  async submit(board: string, userId: string, score: number, ts = Date.now()): Promise<void> {
    await this.redis.zadd(this.key(board), String(compositeScore(score, ts)), userId);
  }

  /** Increment a player's score by delta (e.g. points earned). O(log n). */
  async increment(board: string, userId: string, delta: number): Promise<number> {
    // For incremental scoring we store the raw score (no tie-break) so increments compose.
    const v = await this.redis.zincrby(this.key(board), delta, userId);
    return Number(v);
  }

  async top(board: string, n: number): Promise<Entry[]> {
    const rows = await this.redis.zrevrange(this.key(board), 0, n - 1, 'WITHSCORES');
    return this.toEntries(rows, 0);
  }

  async rankOf(board: string, userId: string): Promise<number | null> {
    const rank = await this.redis.zrevrank(this.key(board), userId);
    return rank == null ? null : rank + 1; // 1-based
  }

  async scoreOf(board: string, userId: string): Promise<number | null> {
    const s = await this.redis.zscore(this.key(board), userId);
    return s == null ? null : Number(s);
  }

  /** The window of players around a given player (±radius). */
  async around(board: string, userId: string, radius: number): Promise<Entry[]> {
    const rank = await this.redis.zrevrank(this.key(board), userId);
    if (rank == null) return [];
    const start = Math.max(0, rank - radius);
    const rows = await this.redis.zrevrange(this.key(board), start, rank + radius, 'WITHSCORES');
    return this.toEntries(rows, start);
  }

  private toEntries(rows: string[], startRank: number): Entry[] {
    const out: Entry[] = [];
    for (let i = 0; i < rows.length; i += 2) {
      out.push({ rank: startRank + i / 2 + 1, userId: rows[i], score: Number(rows[i + 1]) });
    }
    return out;
  }
}
