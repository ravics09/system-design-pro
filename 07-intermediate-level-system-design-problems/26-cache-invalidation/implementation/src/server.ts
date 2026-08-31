import express from 'express';
import mongoose from 'mongoose';
import { Redis } from 'ioredis';
import { Product } from './models';
import { categoryListKey, categoryVersionKey, productKey } from './keys';

const port = Number(process.env.PORT ?? 3126);
const ttl = Number(process.env.CACHE_TTL_S ?? 300);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/cacheinval');
  const redis = new Redis(process.env.REDIS_URL ?? 'redis://127.0.0.1:6379');

  const catVersion = async (cat: string) => Number((await redis.get(categoryVersionKey(cat))) ?? 1);

  const app = express();
  app.use(express.json());
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  // Read: cache-aside (fill on miss, TTL backstop).
  app.get('/api/products/:id', async (req, res) => {
    const key = productKey(req.params.id);
    const cached = await redis.get(key);
    if (cached) return res.json({ source: 'cache', product: JSON.parse(cached) });
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).json({ error: 'not found' });
    await redis.set(key, JSON.stringify(product), 'EX', ttl);
    res.json({ source: 'db', product });
  });

  app.post('/api/products', async (req, res) => {
    const product = await Product.create({
      name: req.body?.name, category: req.body?.category, priceCents: Number(req.body?.priceCents ?? 0),
    });
    await redis.incr(categoryVersionKey(product.category!)); // new item → invalidate its category lists
    res.status(201).json(product);
  });

  // Write: update DB, then INVALIDATE (write-then-invalidate avoids the stale-cache race).
  app.put('/api/products/:id', async (req, res) => {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { name: req.body?.name, priceCents: req.body?.priceCents, updatedAt: new Date() } },
      { new: true },
    ).lean();
    if (!product) return res.status(404).json({ error: 'not found' });
    await redis.del(productKey(req.params.id)); // delete (not overwrite) the entity key
    await redis.incr(categoryVersionKey(product.category!)); // bump group version
    res.json({ product, invalidated: [productKey(req.params.id), `category:${product.category}`] });
  });

  // Read a category list via a VERSIONED key → a version bump invalidates the whole group.
  app.get('/api/categories/:category/products', async (req, res) => {
    const v = await catVersion(req.params.category);
    const key = categoryListKey(req.params.category, v);
    const cached = await redis.get(key);
    if (cached) return res.json({ source: 'cache', version: v, items: JSON.parse(cached) });
    const items = await Product.find({ category: req.params.category }).sort({ _id: -1 }).limit(50).lean();
    await redis.set(key, JSON.stringify(items), 'EX', ttl);
    res.json({ source: 'db', version: v, items });
  });

  app.listen(port, () => console.log(`[cache-inval] listening on :${port}`));
}

main().catch((err) => { console.error('fatal', err); process.exit(1); });
