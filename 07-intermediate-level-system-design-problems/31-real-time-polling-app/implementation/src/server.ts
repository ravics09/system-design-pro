import { randomUUID } from 'node:crypto';
import express from 'express';
import type { Response } from 'express';
import { Redis } from 'ioredis';
import { totalVotes, voteDeltas } from './vote';

const port = Number(process.env.PORT ?? 3131);
const redisUrl = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';

const redis = new Redis(redisUrl);
const sub = redis.duplicate(); // dedicated subscriber for pub/sub fan-out

// SSE clients per poll on THIS instance; pub/sub delivers votes from any instance.
const clients = new Map<string, Set<Response>>();

async function main() {
  await sub.psubscribe('poll:*');
  sub.on('pmessage', (_pattern, channel, message) => {
    const pollId = channel.split(':')[1];
    for (const res of clients.get(pollId) ?? []) res.write(`data: ${message}\n\n`);
  });

  const metaKey = (id: string) => `poll:${id}:meta`;
  const countKey = (id: string) => `poll:${id}:counts`;
  const votedKey = (id: string) => `poll:${id}:voted`;

  async function resultsOf(id: string) {
    const [meta, counts] = await Promise.all([redis.hgetall(metaKey(id)), redis.hgetall(countKey(id))]);
    return { id, question: meta.question, options: JSON.parse(meta.options ?? '[]'), counts, total: totalVotes(counts) };
  }

  const app = express();
  app.use(express.json());
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.post('/api/polls', async (req, res) => {
    const question = String(req.body?.question ?? '').trim();
    const options: string[] = Array.isArray(req.body?.options) ? req.body.options.map(String) : [];
    if (!question || options.length < 2) return res.status(400).json({ error: 'question and >=2 options required' });
    const id = randomUUID().slice(0, 8);
    await redis.hset(metaKey(id), { question, options: JSON.stringify(options) });
    res.status(201).json({ id, question, options });
  });

  app.post('/api/polls/:id/vote', async (req, res) => {
    const { userId, option } = req.body ?? {};
    if (!userId || !option) return res.status(400).json({ error: 'userId and option required' });
    const meta = await redis.hget(metaKey(req.params.id), 'options');
    if (!meta) return res.status(404).json({ error: 'poll not found' });
    if (!(JSON.parse(meta) as string[]).includes(option)) return res.status(400).json({ error: 'invalid option' });

    const prev = await redis.hget(votedKey(req.params.id), userId);
    const deltas = voteDeltas(prev, option);
    const pipe = redis.multi();
    pipe.hset(votedKey(req.params.id), userId, option); // one (changeable) vote per user
    for (const [opt, d] of Object.entries(deltas)) pipe.hincrby(countKey(req.params.id), opt, d as number);
    await pipe.exec();

    const results = await resultsOf(req.params.id);
    await redis.publish(`poll:${req.params.id}`, JSON.stringify(results)); // fan out to all instances
    res.json(results);
  });

  app.get('/api/polls/:id', async (req, res) => res.json(await resultsOf(req.params.id)));

  // Live results via SSE (fed by Redis pub/sub, so votes on any instance reach every viewer).
  app.get('/api/polls/:id/stream', async (req, res) => {
    res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.flushHeaders();
    res.write(`data: ${JSON.stringify(await resultsOf(req.params.id))}\n\n`);
    let set = clients.get(req.params.id);
    if (!set) clients.set(req.params.id, (set = new Set()));
    set.add(res);
    req.on('close', () => set!.delete(res));
  });

  app.listen(port, () => console.log(`[polling] listening on :${port}`));
}

main().catch((err) => { console.error('fatal', err); process.exit(1); });
