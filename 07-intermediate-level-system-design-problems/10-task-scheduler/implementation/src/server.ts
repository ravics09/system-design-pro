import express from 'express';
import { Redis } from 'ioredis';
import { Scheduler } from './scheduler';
import type { Schedule } from './cron';

const port = Number(process.env.PORT ?? 3110);
const pollMs = Number(process.env.POLL_INTERVAL_MS ?? 1000);
const redis = new Redis(process.env.REDIS_URL ?? 'redis://127.0.0.1:6379');
const scheduler = new Scheduler(redis);

// Dispatcher loop: every instance polls; the atomic Lua claim guarantees each firing runs once.
const timer = setInterval(async () => {
  try {
    const due = await scheduler.claimDue();
    for (const jobId of due) await scheduler.runJob(jobId);
  } catch (e) {
    console.error('dispatch error', e);
  }
}, pollMs);

const app = express();
app.use(express.json());
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Schedule a job. body: { name, schedule: {type:'once',at} | {type:'interval',everyMs} | {type:'cron',expr} }
app.post('/api/jobs', async (req, res) => {
  const name = String(req.body?.name ?? '').trim();
  const schedule = req.body?.schedule as Schedule;
  if (!name || !schedule?.type) return res.status(400).json({ error: 'name and schedule required' });
  try {
    const job = await scheduler.schedule(name, schedule);
    if (!job) return res.status(400).json({ error: 'schedule is in the past' });
    res.status(201).json(job);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

app.get('/api/jobs/:id', async (req, res) => {
  const job = await scheduler.getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'not found' });
  res.json({ ...job, runTimestamps: await scheduler.runs(req.params.id) });
});

const server = app.listen(port, () => console.log(`[scheduler] listening on :${port}`));
process.on('SIGTERM', () => { clearInterval(timer); server.close(); });
