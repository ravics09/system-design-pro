import express from 'express';
import mongoose from 'mongoose';
import { Redis } from 'ioredis';
import { config } from './config';
import { ReactionStore } from './store';
import { isReaction, totalOf } from './reactions';

async function main() {
  await mongoose.connect(config.mongoUri);
  const redis = new Redis(config.redisUrl);
  const store = new ReactionStore(redis);

  // Write-behind flusher: batches Redis counters into Mongo periodically.
  const timer = setInterval(() => {
    store.flush().catch((e) => console.error('flush error', e));
  }, config.flushIntervalMs);

  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  // React: body { userId, reaction } where reaction is a type or null to remove.
  app.post('/api/posts/:postId/react', async (req, res) => {
    const userId = String(req.body?.userId ?? '').trim();
    const reaction = req.body?.reaction ?? null;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    if (reaction !== null && !isReaction(reaction)) return res.status(400).json({ error: 'invalid reaction' });
    const counts = await store.react(req.params.postId, userId, reaction);
    res.json({ counts, total: totalOf(counts) });
  });

  app.get('/api/posts/:postId/reactions', async (req, res) => {
    const counts = await store.counts(req.params.postId);
    const userId = req.query.userId ? String(req.query.userId) : null;
    const mine = userId ? await store.myReaction(req.params.postId, userId) : undefined;
    res.json({ counts, total: totalOf(counts), mine });
  });

  const server = app.listen(config.port, () => console.log(`[reactions] listening on :${config.port}`));
  process.on('SIGTERM', () => { clearInterval(timer); server.close(); });
}

main().catch((err) => { console.error('fatal', err); process.exit(1); });
