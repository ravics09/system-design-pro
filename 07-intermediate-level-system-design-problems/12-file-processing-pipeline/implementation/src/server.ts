import express from 'express';
import mongoose from 'mongoose';
import { Redis } from 'ioredis';
import { config } from './config';
import { Job } from './models';
import { QUEUE, requeueStale, runWorker } from './worker';

async function main() {
  await mongoose.connect(config.mongoUri);
  const redis = new Redis(config.redisUrl);

  // Start N in-process consumers (scale out with more containers in production).
  const signal = { stop: false };
  for (let i = 0; i < config.workers; i++) void runWorker(redis, config.leaseMs, signal);
  const reaper = setInterval(() => requeueStale(redis).catch(() => 0), 5000);

  const app = express();
  app.use(express.json());
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  // Producer: create a job and enqueue. Responds immediately (202) — no processing in-request.
  app.post('/api/jobs', async (req, res) => {
    const filename = String(req.body?.filename ?? '').trim();
    if (!filename) return res.status(400).json({ error: 'filename required' });
    const job = await Job.create({ filename, sourceHeight: Number(req.body?.sourceHeight ?? 1080) });
    await redis.lpush(QUEUE, String(job._id));
    res.status(202).json({ id: job._id, status: job.status });
  });

  app.get('/api/jobs/:id', async (req, res) => {
    const job = await Job.findById(req.params.id).lean();
    if (!job) return res.status(404).json({ error: 'not found' });
    res.json(job);
  });

  app.get('/api/jobs', async (_req, res) => {
    res.json({ items: await Job.find().sort({ createdAt: -1 }).limit(50).lean() });
  });

  const server = app.listen(config.port, () => console.log(`[pipeline] listening on :${config.port} (${config.workers} workers)`));
  process.on('SIGTERM', () => { signal.stop = true; clearInterval(reaper); server.close(); });
}

main().catch((err) => { console.error('fatal', err); process.exit(1); });
