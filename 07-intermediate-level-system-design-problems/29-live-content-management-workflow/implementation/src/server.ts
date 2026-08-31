import express from 'express';
import mongoose from 'mongoose';
import { Content } from './models';
import { nextStatus, type Action, type Status } from './workflow';

const port = Number(process.env.PORT ?? 3129);
const publishIntervalMs = Number(process.env.PUBLISH_INTERVAL_MS ?? 5000);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/cms');

  // Scheduled publishing: flip due scheduled content to published (idempotent, atomic guard).
  const scheduler = setInterval(async () => {
    const due = await Content.find({ status: 'scheduled', publishAt: { $lte: new Date() } }, { _id: 1 }).lean();
    for (const d of due) {
      await Content.updateOne(
        { _id: d._id, status: 'scheduled' },
        { $set: { status: 'published', publishedAt: new Date() }, $push: { history: { from: 'scheduled', to: 'published', action: 'publish_due', by: 'system', at: new Date() } } },
      );
    }
  }, publishIntervalMs);

  const app = express();
  app.use(express.json());
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.post('/api/content', async (req, res) => {
    const title = String(req.body?.title ?? '').trim();
    if (!title) return res.status(400).json({ error: 'title required' });
    const content = await Content.create({ title, body: req.body?.body ?? '' });
    res.status(201).json(content);
  });

  app.get('/api/content/:id', async (req, res) => {
    const c = await Content.findById(req.params.id).lean();
    if (!c) return res.status(404).json({ error: 'not found' });
    res.json(c);
  });

  // The ONLY way to change status: a validated transition (enforced by the FSM + recorded in history).
  app.post('/api/content/:id/transition', async (req, res) => {
    const action = req.body?.action as Action;
    const by = String(req.body?.by ?? 'editor');
    const doc = await Content.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'not found' });
    const next = nextStatus(doc.status as Status, action);
    if (!next) return res.status(400).json({ error: `illegal transition: ${doc.status} --${action}-->` });
    if (action === 'approve_schedule') {
      const publishAt = new Date(req.body?.publishAt ?? Date.now() + 60_000);
      doc.publishAt = publishAt;
    }
    if (next === 'published') doc.publishedAt = new Date();
    doc.history.push({ from: doc.status, to: next, action, by, at: new Date() } as never);
    doc.status = next;
    await doc.save();
    res.json(doc);
  });

  const server = app.listen(port, () => console.log(`[cms] listening on :${port}`));
  process.on('SIGTERM', () => { clearInterval(scheduler); server.close(); });
}

main().catch((err) => { console.error('fatal', err); process.exit(1); });
