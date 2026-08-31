import express from 'express';
import mongoose from 'mongoose';
import { Log } from './models';
import { normalizeLog, type LogEntry } from './logs';

const port = Number(process.env.PORT ?? 3115);
const flushSize = Number(process.env.FLUSH_SIZE ?? 100);
const flushIntervalMs = Number(process.env.FLUSH_INTERVAL_MS ?? 1000);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/logs');

  // Buffer + batch insert (async ingestion so producers are never blocked on the store).
  let buffer: LogEntry[] = [];
  const flush = async () => {
    if (buffer.length === 0) return;
    const batch = buffer;
    buffer = [];
    try {
      await Log.insertMany(batch, { ordered: false });
    } catch (e) {
      console.error('flush error', (e as Error).message);
    }
  };
  const timer = setInterval(() => void flush(), flushIntervalMs);

  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok', buffered: buffer.length }));

  // Ingest one log or an array. Returns 202 immediately (buffered).
  app.post('/api/logs', (req, res) => {
    const raw = Array.isArray(req.body) ? req.body : [req.body];
    for (const r of raw) buffer.push(normalizeLog(r ?? {}));
    if (buffer.length >= flushSize) void flush();
    res.status(202).json({ accepted: raw.length });
  });

  // Query logs by service/level/traceId/time, newest-first.
  app.get('/api/logs', async (req, res) => {
    const q: Record<string, unknown> = {};
    if (req.query.service) q.service = req.query.service;
    if (req.query.level) q.level = req.query.level;
    if (req.query.traceId) q.traceId = req.query.traceId;
    if (req.query.q) q.message = { $regex: String(req.query.q), $options: 'i' };
    const limit = Math.min(500, Math.max(1, Number(req.query.limit ?? 100)));
    res.json({ items: await Log.find(q).sort({ ts: -1 }).limit(limit).lean() });
  });

  // Follow one request across services (correlation).
  app.get('/api/trace/:traceId', async (req, res) => {
    res.json({ items: await Log.find({ traceId: req.params.traceId }).sort({ ts: 1 }).lean() });
  });

  const server = app.listen(port, () => console.log(`[logging] listening on :${port}`));
  process.on('SIGTERM', async () => { clearInterval(timer); await flush(); server.close(); });
}

main().catch((err) => { console.error('fatal', err); process.exit(1); });
