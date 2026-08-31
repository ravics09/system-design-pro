import express from 'express';
import { Redis } from 'ioredis';
import { config } from './config';
import { PresenceStore } from './presence';

const redis = new Redis(config.redisUrl);
const presence = new PresenceStore(redis, config.presenceTtlS);

const app = express();
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Clients call this every ~10s while active (TTL is ~2-3x that).
app.post('/api/heartbeat', async (req, res) => {
  const userId = String(req.body?.userId ?? '').trim();
  if (!userId) return res.status(400).json({ error: 'userId required' });
  await presence.heartbeat(userId);
  res.json({ ok: true, ttlSeconds: config.presenceTtlS });
});

app.get('/api/status/:userId', async (req, res) => {
  res.json(await presence.status(req.params.userId));
});

app.get('/api/online', async (_req, res) => {
  const [users, count] = await Promise.all([presence.listOnline(), presence.onlineCount()]);
  res.json({ count, users });
});

// Presence for a friend list: /api/online-among?ids=a,b,c
app.get('/api/online-among', async (req, res) => {
  const ids = String(req.query.ids ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  res.json(await presence.statusFor(ids));
});

app.listen(config.port, () => console.log(`[whos-online] listening on :${config.port}`));
