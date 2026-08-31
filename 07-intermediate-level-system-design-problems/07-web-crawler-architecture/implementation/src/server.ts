import express from 'express';
import mongoose from 'mongoose';
import { Redis } from 'ioredis';
import { config } from './config';
import { Crawler } from './crawler';
import { Page } from './models';

async function main() {
  await mongoose.connect(config.mongoUri);
  const redis = new Redis(config.redisUrl);
  const crawler = new Crawler(redis);
  let running = false;

  const app = express();
  app.use(express.json());
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  // Kick off a bounded crawl. Runs in the background; poll /api/pages for results.
  app.post('/api/crawl', async (req, res) => {
    const seed = String(req.body?.seed ?? '').trim();
    const maxPages = Math.min(500, Math.max(1, Number(req.body?.maxPages ?? 20)));
    const sameDomainOnly = req.body?.sameDomainOnly !== false;
    if (!seed) return res.status(400).json({ error: 'seed url required' });
    if (running) return res.status(409).json({ error: 'a crawl is already running' });
    running = true;
    crawler
      .start(seed, maxPages, sameDomainOnly)
      .then((r) => console.log(`[crawler] done: ${r.crawled} pages`))
      .catch((e) => console.error('crawl error', e))
      .finally(() => (running = false));
    res.status(202).json({ started: true, seed, maxPages, sameDomainOnly });
  });

  app.get('/api/pages', async (_req, res) => {
    const [items, total] = await Promise.all([
      Page.find().sort({ fetchedAt: -1 }).limit(100).lean(),
      Page.countDocuments(),
    ]);
    res.json({ total, running, items });
  });

  app.listen(config.port, () => console.log(`[crawler] listening on :${config.port}`));
}

main().catch((err) => { console.error('fatal', err); process.exit(1); });
