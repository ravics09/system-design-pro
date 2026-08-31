import express from 'express';
import mongoose from 'mongoose';
import { Post } from './models';
import { buildTagQuery, normalizeTags } from './tags';

const port = Number(process.env.PORT ?? 3111);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/tagging');

  const app = express();
  app.use(express.json());
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.post('/api/posts', async (req, res) => {
    const title = String(req.body?.title ?? '').trim();
    if (!title) return res.status(400).json({ error: 'title required' });
    const tags = normalizeTags(req.body?.tags);
    const post = await Post.create({ title, body: req.body?.body ?? '', tags });
    res.status(201).json(post);
  });

  // "Posts with tag X", newest-first, keyset-paginated.
  app.get('/api/tags/:tag/posts', async (req, res) => {
    const tag = normalizeTags([req.params.tag])[0];
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
    const q = buildTagQuery(tag ? [tag] : [], 'all', req.query.cursor ? String(req.query.cursor) : null);
    const items = await Post.find(q).sort({ _id: -1 }).limit(limit).lean();
    res.json({ items, nextCursor: items.length === limit ? String(items[items.length - 1]._id) : null });
  });

  // Multi-tag query: /api/posts?tags=a,b&mode=all|any
  app.get('/api/posts', async (req, res) => {
    const tags = normalizeTags(String(req.query.tags ?? '').split(','));
    const mode = req.query.mode === 'any' ? 'any' : 'all';
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
    const q = buildTagQuery(tags, mode, req.query.cursor ? String(req.query.cursor) : null);
    const items = await Post.find(q).sort({ _id: -1 }).limit(limit).lean();
    res.json({ mode, tags, items, nextCursor: items.length === limit ? String(items[items.length - 1]._id) : null });
  });

  app.listen(port, () => console.log(`[tagging] listening on :${port}`));
}

main().catch((err) => { console.error('fatal', err); process.exit(1); });
