import { randomUUID } from 'node:crypto';
import express from 'express';
import mongoose from 'mongoose';
import { Redis } from 'ioredis';
import { config } from './config';
import { FlashSale } from './sale';
import { Order } from './models';

async function main() {
  await mongoose.connect(config.mongoUri);
  const redis = new Redis(config.redisUrl);
  const sale = new FlashSale(redis, config.reservationTtlMs);
  const items = new Set<string>();

  // Reaper: periodically return expired (unpaid) reservations to the stock pool.
  const timer = setInterval(async () => {
    for (const item of items) await sale.reapExpired(item).catch(() => 0);
  }, config.reapIntervalMs);

  const app = express();
  app.use(express.json());
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.post('/api/sales/:item/init', async (req, res) => {
    const stock = Math.max(0, Number(req.body?.stock ?? 0));
    await sale.init(req.params.item, stock);
    items.add(req.params.item);
    res.json({ item: req.params.item, stock });
  });

  app.get('/api/sales/:item', async (req, res) => {
    res.json({ item: req.params.item, remaining: await sale.remaining(req.params.item) });
  });

  app.post('/api/sales/:item/reserve', async (req, res) => {
    items.add(req.params.item);
    const reservationId = randomUUID();
    const ok = await sale.reserve(req.params.item, reservationId);
    if (!ok) return res.status(409).json({ error: 'sold out' });
    res.json({ reservationId, expiresInMs: config.reservationTtlMs });
  });

  app.post('/api/sales/:item/confirm', async (req, res) => {
    const { reservationId, userId } = req.body ?? {};
    if (!reservationId || !userId) return res.status(400).json({ error: 'reservationId and userId required' });
    // Idempotent: if an order already exists for this reservation, return it.
    const existing = await Order.findOne({ reservationId }).lean();
    if (existing) return res.json({ order: existing, idempotent: true });
    const valid = await sale.confirm(req.params.item, reservationId);
    if (!valid) return res.status(410).json({ error: 'reservation expired or invalid' });
    const order = await Order.create({ reservationId, item: req.params.item, userId });
    res.status(201).json({ order });
  });

  const server = app.listen(config.port, () => console.log(`[flash-sale] listening on :${config.port}`));
  process.on('SIGTERM', () => { clearInterval(timer); server.close(); });
}

main().catch((err) => { console.error('fatal', err); process.exit(1); });
