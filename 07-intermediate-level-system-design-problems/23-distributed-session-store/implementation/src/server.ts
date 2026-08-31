import express from 'express';
import session from 'express-session';
import RedisStore from 'connect-redis';
import { Redis } from 'ioredis';
import { buildCookieOptions } from './cookie';

const port = Number(process.env.PORT ?? 3123);
const ttlS = Number(process.env.SESSION_TTL_S ?? 1800);

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

const redis = new Redis(process.env.REDIS_URL ?? 'redis://127.0.0.1:6379');

const app = express();
app.use(express.json());

// Sessions live in Redis (shared) → the app tier is stateless and any instance can serve any request.
app.use(
  session({
    store: new RedisStore({ client: redis, prefix: 'sess:', ttl: ttlS }),
    secret: process.env.SESSION_SECRET ?? 'dev-session-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: buildCookieOptions(process.env.NODE_ENV ?? 'development', ttlS),
  }),
);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', instance: process.pid }));

app.post('/api/login', (req, res) => {
  const userId = String(req.body?.userId ?? '').trim();
  if (!userId) return res.status(400).json({ error: 'userId required' });
  req.session.regenerate((err) => {
    // Regenerate the session id on login to prevent session fixation.
    if (err) return res.status(500).json({ error: 'session error' });
    req.session.userId = userId;
    res.json({ ok: true, userId });
  });
});

app.get('/api/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'not authenticated' });
  res.json({ userId: req.session.userId, servedBy: process.pid });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true })); // deleting the Redis key = cluster-wide logout
});

app.listen(port, () => console.log(`[session-store] listening on :${port} (pid ${process.pid})`));
