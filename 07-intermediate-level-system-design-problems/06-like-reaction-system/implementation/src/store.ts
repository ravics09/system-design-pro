import type { Redis } from 'ioredis';
import { Schema, model } from 'mongoose';
import { REACTIONS, emptyCounts, reactionDeltas, type Counts, type Reaction } from './reactions';

/** Durable source of truth (write-behind target). */
const postStatSchema = new Schema(
  { postId: { type: String, unique: true }, counts: { type: Object, default: {} } },
  { versionKey: false, timestamps: true },
);
export const PostStat = model('PostStat', postStatSchema);

/**
 * Hot path lives in Redis:
 *  - reaction:{post} hash → userId => reaction  (enforces one-per-user + enables "did I react")
 *  - counts:{post} hash → reaction => count     (atomic HINCRBY, no DB row lock)
 *  - dirty set of posts to flush to Mongo (write-behind)
 */
export class ReactionStore {
  constructor(private readonly redis: Redis) {}

  private userKey(postId: string) { return `reaction:${postId}`; }
  private countKey(postId: string) { return `counts:${postId}`; }

  /** Set/replace/remove a user's reaction. Returns the applied deltas (empty = no-op). */
  async react(postId: string, userId: string, next: Reaction | null): Promise<Counts> {
    const prev = (await this.redis.hget(this.userKey(postId), userId)) as Reaction | null;
    const deltas = reactionDeltas(prev, next);
    const pipe = this.redis.multi();
    if (next) pipe.hset(this.userKey(postId), userId, next);
    else pipe.hdel(this.userKey(postId), userId);
    for (const [r, d] of Object.entries(deltas)) pipe.hincrby(this.countKey(postId), r, d);
    pipe.sadd('dirty:posts', postId);
    await pipe.exec();
    return this.counts(postId);
  }

  async counts(postId: string): Promise<Counts> {
    const raw = await this.redis.hgetall(this.countKey(postId));
    const counts = emptyCounts();
    for (const r of REACTIONS) counts[r] = Number(raw[r] ?? 0);
    return counts;
  }

  async myReaction(postId: string, userId: string): Promise<Reaction | null> {
    return (await this.redis.hget(this.userKey(postId), userId)) as Reaction | null;
  }

  /** Write-behind: persist dirty posts' counts to Mongo in a batch. */
  async flush(): Promise<number> {
    const posts = await this.redis.spop('dirty:posts', 500);
    if (!posts || posts.length === 0) return 0;
    for (const postId of posts) {
      const counts = await this.counts(postId);
      await PostStat.updateOne({ postId }, { $set: { counts } }, { upsert: true });
    }
    return posts.length;
  }
}
