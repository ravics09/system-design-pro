import express from 'express';
import mongoose from 'mongoose';
import { Redis } from 'ioredis';
import { Post } from './models';
import { makePostId, mergeTimelines, shouldFanout } from './feed';

const port = Number(process.env.PORT ?? 3118);
const threshold = Number(process.env.CELEBRITY_THRESHOLD ?? 1000);
const feedCap = Number(process.env.FEED_CAP ?? 800);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/feed');
  const redis = new Redis(process.env.REDIS_URL ?? 'redis://127.0.0.1:6379');

  const app = express();
  app.use(express.json());
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.post('/api/follow', async (req, res) => {
    const { follower, followee } = req.body ?? {};
    if (!follower || !followee) return res.status(400).json({ error: 'follower and followee required' });
    await redis.multi().sadd(`followers:${followee}`, follower).sadd(`following:${follower}`, followee).exec();
    res.json({ ok: true });
  });

  app.post('/api/posts', async (req, res) => {
    const authorId = String(req.body?.authorId ?? '').trim();
    const text = String(req.body?.text ?? '');
    if (!authorId || !text) return res.status(400).json({ error: 'authorId and text required' });
    const postId = makePostId();
    await Post.create({ postId, authorId, text });
    await redis.lpush(`posts:${authorId}`, postId); // author's own recent posts (for pull path)
    await redis.ltrim(`posts:${authorId}`, 0, feedCap - 1);

    const followerCount = await redis.scard(`followers:${authorId}`);
    let fannedOut = 0;
    if (shouldFanout(followerCount, threshold)) {
      const followers = await redis.smembers(`followers:${authorId}`);
      const pipe = redis.pipeline();
      for (const f of followers) {
        pipe.lpush(`feed:${f}`, postId);
        pipe.ltrim(`feed:${f}`, 0, feedCap - 1);
      }
      await pipe.exec();
      fannedOut = followers.length;
    }
    res.status(201).json({ postId, fannedOut, strategy: fannedOut ? 'push' : 'pull (celebrity or no followers)' });
  });

  // Home timeline: precomputed push feed + pull recent posts from followed celebrities, merged.
  app.get('/api/feed/:userId', async (req, res) => {
    const userId = req.params.userId;
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
    const base = await redis.lrange(`feed:${userId}`, 0, limit - 1);

    const following = await redis.smembers(`following:${userId}`);
    const celebLists: string[][] = [];
    for (const followee of following) {
      const fc = await redis.scard(`followers:${followee}`);
      if (!shouldFanout(fc, threshold)) celebLists.push(await redis.lrange(`posts:${followee}`, 0, limit - 1));
    }

    const ids = mergeTimelines([base, ...celebLists], limit);
    const posts = await Post.find({ postId: { $in: ids } }).lean();
    const byId = new Map(posts.map((p) => [p.postId, p]));
    res.json({ items: ids.map((id) => byId.get(id)).filter(Boolean) });
  });

  app.listen(port, () => console.log(`[feed] listening on :${port}`));
}

main().catch((err) => { console.error('fatal', err); process.exit(1); });
