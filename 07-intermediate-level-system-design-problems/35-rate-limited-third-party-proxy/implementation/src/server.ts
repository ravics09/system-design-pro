import express from 'express';
import { Redis } from 'ioredis';
import { cacheKey } from './limiter';

const port = Number(process.env.PORT ?? 3135);
const upstreamUrl = process.env.UPSTREAM_URL ?? 'http://127.0.0.1:4100';
const capacity = Number(process.env.RATE_CAPACITY ?? 10);
const refillPerSec = Number(process.env.RATE_REFILL_PER_SEC ?? 2);
const cacheTtlS = Number(process.env.CACHE_TTL_S ?? 30);

const redis = new Redis(process.env.REDIS_URL ?? 'redis://127.0.0.1:6379');

// Atomic shared token bucket in Redis → one global quota across all proxy instances.
const BUCKET_LUA = `
local data = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local tokens = tonumber(data[1]); local ts = tonumber(data[2])
local now = tonumber(ARGV[1]); local rate = tonumber(ARGV[2]); local cap = tonumber(ARGV[3])
if tokens == nil then tokens = cap; ts = now end
tokens = math.min(cap, tokens + ((now - ts) / 1000) * rate)
local allowed = 0
if tokens >= 1 then tokens = tokens - 1; allowed = 1 end
redis.call('HMSET', KEYS[1], 'tokens', tokens, 'ts', now)
redis.call('PEXPIRE', KEYS[1], 60000)
return allowed`;

async function takeToken(): Promise<boolean> {
  const r = (await redis.eval(BUCKET_LUA, 1, 'quota:thirdparty', String(Date.now()), String(refillPerSec), String(capacity))) as number;
  return r === 1;
}

// Single-flight: coalesce concurrent identical requests into one upstream call.
const inflight = new Map<string, Promise<unknown>>();

const app = express();
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/api/proxy/:resource', async (req, res) => {
  const key = cacheKey(req.params.resource, req.query as Record<string, unknown>);

  const cached = await redis.get(key);
  if (cached) return res.json({ source: 'cache', data: JSON.parse(cached) });

  if (inflight.has(key)) {
    return res.json({ source: 'coalesced', data: await inflight.get(key) }); // share one in-flight call
  }

  if (!(await takeToken())) {
    return res.status(429).json({ error: 'upstream quota exhausted — try again shortly' });
  }

  const promise = (async () => {
    const url = `${upstreamUrl}/${req.params.resource}`;
    const upstream = await fetch(url);
    const data = await upstream.json();
    await redis.set(key, JSON.stringify(data), 'EX', cacheTtlS);
    return data;
  })();
  inflight.set(key, promise);
  try {
    const data = await promise;
    res.json({ source: 'upstream', data });
  } catch {
    res.status(502).json({ error: 'upstream error' });
  } finally {
    inflight.delete(key);
  }
});

app.listen(port, () => console.log(`[proxy] listening on :${port} → ${upstreamUrl}`));
