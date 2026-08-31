import express from 'express';
import mongoose from 'mongoose';
import { pickReadPreference } from './readpref';

const port = Number(process.env.PORT ?? 3132);

const itemSchema = new mongoose.Schema({ sku: { type: String, unique: true }, qty: Number }, { versionKey: false });
const Item = mongoose.model('Item', itemSchema);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/replag');

  const app = express();
  app.use(express.json());
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  // Write with w:majority → acknowledged only once a majority has it (survives failover, no rollback).
  app.post('/api/items', async (req, res) => {
    const sku = String(req.body?.sku ?? '').trim();
    if (!sku) return res.status(400).json({ error: 'sku required' });
    const doc = new Item({ sku, qty: Number(req.body?.qty ?? 0) });
    await doc.save({ w: 'majority' });
    res.status(201).json(doc);
  });

  // Read with a chosen preference. ?consistency=strong → primary; =eventual → secondaryPreferred.
  app.get('/api/items/:sku', async (req, res) => {
    const pref = pickReadPreference(req.query.consistency as string | undefined);
    const doc = await Item.findOne({ sku: req.params.sku })
      .read(pref)
      .readConcern(pref === 'primary' ? 'majority' : 'available')
      .lean();
    if (!doc) return res.status(404).json({ error: 'not found' });
    res.json({ readPreference: pref, item: doc });
  });

  // Causal consistency: write then read your own write even from a secondary (session waits for
  // the secondary to catch up to the write's cluster time).
  app.post('/api/items/:sku/causal-adjust', async (req, res) => {
    const delta = Number(req.body?.delta ?? 0);
    const session = await mongoose.startSession({ causalConsistency: true });
    try {
      let result: unknown;
      await session.withTransaction(async () => {
        await Item.updateOne({ sku: req.params.sku }, { $inc: { qty: delta } }, { session, upsert: true });
        result = await Item.findOne({ sku: req.params.sku }).session(session).read('secondaryPreferred').lean();
      });
      res.json({ causallyConsistent: true, item: result });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    } finally {
      await session.endSession();
    }
  });

  app.listen(port, () => console.log(`[repl-lag] listening on :${port}`));
}

main().catch((err) => { console.error('fatal', err); process.exit(1); });
