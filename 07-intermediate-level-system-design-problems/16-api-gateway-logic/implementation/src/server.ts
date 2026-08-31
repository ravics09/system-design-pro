import { randomUUID } from 'node:crypto';
import express from 'express';
import { matchRoute, rewritePath, RateLimiter, type Route } from './routing';

const port = Number(process.env.PORT ?? 3116);
const token = process.env.GATEWAY_TOKEN ?? 'dev-token';

const routes: Route[] = [
  { prefix: '/users', target: process.env.USERS_URL ?? 'http://127.0.0.1:4001' },
  { prefix: '/orders', target: process.env.ORDERS_URL ?? 'http://127.0.0.1:4002', auth: true },
];

const limiter = new RateLimiter(Number(process.env.RATE_CAPACITY ?? 20), Number(process.env.RATE_REFILL_PER_SEC ?? 10));

const app = express();
app.use(express.raw({ type: '*/*', limit: '2mb' })); // capture raw body to forward verbatim

app.get('/api/health', (_req, res) => res.json({ status: 'ok', routes: routes.map((r) => r.prefix) }));

app.use(async (req, res) => {
  const ip = req.ip ?? 'unknown';
  if (!limiter.allow(ip)) return res.status(429).json({ error: 'rate limit exceeded' });

  const route = matchRoute(routes, req.path);
  if (!route) return res.status(404).json({ error: 'no route' });

  if (route.auth && req.headers.authorization !== `Bearer ${token}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const upstreamPath = rewritePath(route.prefix, req.path);
  const url = route.target + upstreamPath + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '');
  const requestId = (req.headers['x-request-id'] as string) ?? randomUUID();

  try {
    const hasBody = req.method !== 'GET' && req.method !== 'HEAD' && (req.body as Buffer)?.length > 0;
    const upstream = await fetch(url, {
      method: req.method,
      headers: {
        'content-type': (req.headers['content-type'] as string) ?? 'application/json',
        'x-request-id': requestId,
        'x-forwarded-for': ip,
      },
      body: hasBody ? (req.body as Buffer) : undefined,
    });
    const text = await upstream.text();
    res.status(upstream.status);
    res.set('content-type', upstream.headers.get('content-type') ?? 'application/json');
    res.set('x-request-id', requestId);
    res.send(text);
  } catch {
    res.status(502).json({ error: 'bad gateway (upstream unreachable)' });
  }
});

app.listen(port, () => console.log(`[gateway] listening on :${port}`));
