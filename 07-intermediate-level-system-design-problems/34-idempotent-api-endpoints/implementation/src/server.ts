import express from 'express';
import mongoose from 'mongoose';
import { IdempotencyKey, Order } from './models';
import { decideReplay, requestFingerprint } from './idempotency';

const port = Number(process.env.PORT ?? 3134);
const keyTtlS = Number(process.env.KEY_TTL_S ?? 86400);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/idempotency');

  const app = express();
  app.use(express.json());
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  // Create an order — safe to retry with the same Idempotency-Key.
  app.post('/api/orders', async (req, res) => {
    const key = req.header('Idempotency-Key');
    if (!key) return res.status(400).json({ error: 'Idempotency-Key header required' });
    const fingerprint = requestFingerprint(req.body);

    // Insert-first on the unique index: exactly one concurrent caller wins and processes.
    try {
      await IdempotencyKey.create({ key, fingerprint, status: 'pending', expiresAt: new Date(Date.now() + keyTtlS * 1000) });
    } catch (err) {
      if ((err as { code?: number }).code === 11000) {
        const existing = await IdempotencyKey.findOne({ key }).lean();
        const decision = decideReplay(existing as never, fingerprint);
        if (decision === 'conflict') return res.status(422).json({ error: 'Idempotency-Key reused with a different body' });
        if (decision === 'in_progress') return res.status(409).json({ error: 'request with this key is in progress' });
        return res.status(existing!.statusCode ?? 200).json({ idempotentReplay: true, ...(existing!.responseBody as object) });
      }
      throw err;
    }

    // We won the key → do the real work exactly once.
    const order = await Order.create({ item: req.body?.item, qty: Number(req.body?.qty ?? 1) });
    const responseBody = { orderId: String(order._id), item: order.item, qty: order.qty };
    await IdempotencyKey.updateOne({ key }, { $set: { status: 'completed', statusCode: 201, responseBody } });
    res.status(201).json(responseBody);
  });

  app.listen(port, () => console.log(`[idempotency] listening on :${port}`));
}

main().catch((err) => { console.error('fatal', err); process.exit(1); });
