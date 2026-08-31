import express from 'express';
import mongoose from 'mongoose';
import { Redis } from 'ioredis';
import { Membership } from './models';
import { sumCounts } from './unread';

const port = Number(process.env.PORT ?? 3121);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/unread');
  const redis = new Redis(process.env.REDIS_URL ?? 'redis://127.0.0.1:6379');
  const key = (user: string) => `unread:${user}`;

  const app = express();
  app.use(express.json());
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  // A message was delivered to a user in a conversation (they're not actively viewing it).
  app.post('/api/deliver', async (req, res) => {
    const { userId, conversationId } = req.body ?? {};
    if (!userId || !conversationId) return res.status(400).json({ error: 'userId and conversationId required' });
    const n = await redis.hincrby(key(userId), conversationId, 1);
    res.json({ conversationId, unread: n });
  });

  // The user read a conversation up to a message id: reset counter + advance the durable watermark.
  app.post('/api/read', async (req, res) => {
    const { userId, conversationId, lastReadMessageId } = req.body ?? {};
    if (!userId || !conversationId) return res.status(400).json({ error: 'userId and conversationId required' });
    await redis.hdel(key(userId), conversationId); // badge for this conv → 0 (O(1))
    await Membership.updateOne(
      { userId, conversationId },
      { $set: { lastReadMessageId: lastReadMessageId ?? null, updatedAt: new Date() } },
      { upsert: true },
    );
    res.json({ conversationId, unread: 0 });
  });

  // The badge: per-conversation counts + total — served O(1) from Redis (no COUNT(*)).
  app.get('/api/badge/:userId', async (req, res) => {
    const perConversation = await redis.hgetall(key(req.params.userId));
    res.json({ perConversation, total: sumCounts(perConversation) });
  });

  // Read watermarks (multi-device source of truth).
  app.get('/api/watermarks/:userId', async (req, res) => {
    res.json({ items: await Membership.find({ userId: req.params.userId }).lean() });
  });

  app.listen(port, () => console.log(`[unread] listening on :${port}`));
}

main().catch((err) => { console.error('fatal', err); process.exit(1); });
