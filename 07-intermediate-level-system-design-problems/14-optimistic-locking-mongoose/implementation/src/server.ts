import express from 'express';
import mongoose from 'mongoose';
import { Item } from './models';
import { retryOnConflict, ConflictError } from './retry';

const port = Number(process.env.PORT ?? 3114);
const maxRetries = Number(process.env.MAX_RETRIES ?? 5);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/optimistic');

  const app = express();
  app.use(express.json());
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.post('/api/items', async (req, res) => {
    const sku = String(req.body?.sku ?? '').trim();
    if (!sku) return res.status(400).json({ error: 'sku required' });
    const item = await Item.create({ sku, qty: Number(req.body?.qty ?? 0) });
    res.status(201).json(item);
  });

  app.get('/api/items/:sku', async (req, res) => {
    const item = await Item.findOne({ sku: req.params.sku }).lean();
    if (!item) return res.status(404).json({ error: 'not found' });
    res.json(item);
  });

  // Optimistic read-modify-write: guarded by __v, retried on conflict.
  app.patch('/api/items/:sku/adjust', async (req, res) => {
    const delta = Number(req.body?.delta ?? 0);
    try {
      const updated = await retryOnConflict(async () => {
        const item = await Item.findOne({ sku: req.params.sku });
        if (!item) throw new Error('not found');
        item.qty += delta; // in-app logic (why we can't always use a raw $inc)
        await item.save(); // VersionError if another writer bumped __v first
        return item;
      }, maxRetries);
      res.json(updated);
    } catch (err) {
      if (err instanceof ConflictError) return res.status(409).json({ error: err.message });
      if ((err as Error).message === 'not found') return res.status(404).json({ error: 'not found' });
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Atomic alternative: a single conditional update — no read-modify-write window at all.
  app.patch('/api/items/:sku/adjust-atomic', async (req, res) => {
    const delta = Number(req.body?.delta ?? 0);
    const updated = await Item.findOneAndUpdate(
      { sku: req.params.sku },
      { $inc: { qty: delta, __v: 1 } },
      { new: true },
    ).lean();
    if (!updated) return res.status(404).json({ error: 'not found' });
    res.json(updated);
  });

  app.listen(port, () => console.log(`[optimistic] listening on :${port}`));
}

main().catch((err) => { console.error('fatal', err); process.exit(1); });
