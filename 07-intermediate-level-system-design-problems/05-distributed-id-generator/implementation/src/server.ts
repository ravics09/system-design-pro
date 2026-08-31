import express from 'express';
import { Redis } from 'ioredis';
import { Snowflake, decode } from './snowflake';

const port = Number(process.env.PORT ?? 3105);

/** Lease a unique worker id (0-1023). Prefer Redis (auto, cross-instance); else env. */
async function resolveWorkerId(): Promise<number> {
  const url = process.env.REDIS_URL;
  if (url) {
    try {
      const redis = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1 });
      await redis.connect();
      const n = await redis.incr('snowflake:worker-seq');
      await redis.quit();
      return Number((BigInt(n) % 1024n));
    } catch {
      // fall through to env if Redis unavailable
    }
  }
  return Number(process.env.WORKER_ID ?? 1);
}

async function main() {
  const workerId = await resolveWorkerId();
  const gen = new Snowflake(workerId);
  console.log(`[id-gen] worker id = ${workerId}`);

  const app = express();
  app.get('/api/health', (_req, res) => res.json({ status: 'ok', workerId }));

  app.get('/api/id', (_req, res) => {
    const id = gen.nextId();
    res.json({ id: id.toString(), parsed: decode(id) });
  });

  app.get('/api/ids', (req, res) => {
    const count = Math.min(1000, Math.max(1, Number(req.query.count ?? 10)));
    const ids: string[] = [];
    for (let i = 0; i < count; i++) ids.push(gen.nextId().toString());
    res.json({ count, ids });
  });

  app.get('/api/decode/:id', (req, res) => {
    try {
      res.json(decode(BigInt(req.params.id)));
    } catch {
      res.status(400).json({ error: 'invalid id' });
    }
  });

  app.listen(port, () => console.log(`[id-gen] listening on :${port}`));
}

main().catch((err) => {
  console.error('fatal', err);
  process.exit(1);
});
