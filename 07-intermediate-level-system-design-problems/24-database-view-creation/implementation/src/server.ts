import express from 'express';
import mongoose from 'mongoose';
import { buildDailyRevenuePipeline, VIEW_COLLECTION } from './pipeline';

const port = Number(process.env.PORT ?? 3124);
const refreshMs = Number(process.env.REFRESH_INTERVAL_MS ?? 15000);

const orderSchema = new mongoose.Schema(
  { day: String, region: String, totalCents: Number, status: { type: String, default: 'paid' } },
  { versionKey: false },
);
const Order = mongoose.model('Order', orderSchema);

async function refreshView(): Promise<void> {
  // Run the heavy aggregation and $merge the result into the materialized collection.
  await Order.aggregate(buildDailyRevenuePipeline() as unknown as mongoose.PipelineStage[]);
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/reporting');
  const db = mongoose.connection;

  const timer = refreshMs > 0 ? setInterval(() => refreshView().catch(() => {}), refreshMs) : null;

  const app = express();
  app.use(express.json());
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.post('/api/orders', async (req, res) => {
    const { day, region, totalCents, status } = req.body ?? {};
    if (!day || !region || typeof totalCents !== 'number') return res.status(400).json({ error: 'day, region, totalCents required' });
    const order = await Order.create({ day, region, totalCents, status: status ?? 'paid' });
    res.status(201).json(order);
  });

  // Trigger a materialized-view refresh on demand.
  app.post('/api/refresh', async (_req, res) => {
    await refreshView();
    res.json({ ok: true, refreshedAt: new Date() });
  });

  // Fast read from the precomputed materialized view.
  app.get('/api/reports/daily-revenue', async (_req, res) => {
    const rows = await db.collection(VIEW_COLLECTION).find().sort({ _id: 1 }).toArray();
    res.json({ source: 'materialized', items: rows });
  });

  // Live aggregation (for comparison / freshness) — the expensive path a dashboard should avoid.
  app.get('/api/reports/daily-revenue/live', async (_req, res) => {
    const pipeline = buildDailyRevenuePipeline().slice(0, -1) as unknown as mongoose.PipelineStage[]; // drop $merge → just compute
    res.json({ source: 'live', items: await Order.aggregate(pipeline) });
  });

  const server = app.listen(port, () => console.log(`[db-views] listening on :${port}`));
  process.on('SIGTERM', () => { if (timer) clearInterval(timer); server.close(); });
}

main().catch((err) => { console.error('fatal', err); process.exit(1); });
