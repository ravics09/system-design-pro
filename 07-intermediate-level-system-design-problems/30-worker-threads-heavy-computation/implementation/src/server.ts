import os from 'node:os';
import express from 'express';
import { WorkerPool } from './pool';

const port = Number(process.env.PORT ?? 3130);
const poolSize = Number(process.env.POOL_SIZE ?? os.cpus().length);
const pool = new WorkerPool(poolSize);

const app = express();
app.use(express.text({ type: ['text/csv', 'text/plain'], limit: '25mb' }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok', poolSize }));

// Offload CSV parsing/aggregation to the worker pool — the event loop stays free for other requests.
app.post('/api/parse', async (req, res) => {
  const csv = typeof req.body === 'string' ? req.body : String(req.body?.csv ?? '');
  if (!csv.trim()) return res.status(400).json({ error: 'CSV body required (text/csv) or {csv}' });
  const sumColumnName = (req.query.sum as string) || undefined;
  try {
    const result = await pool.run({ csv, sumColumnName });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

const server = app.listen(port, () => console.log(`[worker-threads] listening on :${port} (${poolSize} workers)`));
process.on('SIGTERM', async () => { await pool.destroy(); server.close(); });
