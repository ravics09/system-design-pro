import express from 'express';
import { Redis } from 'ioredis';
import { Trie } from './trie';

const port = Number(process.env.PORT ?? 3113);
const cacheTtl = Number(process.env.CACHE_TTL_S ?? 60);
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 }) : null;
if (redis) redis.connect().catch(() => console.warn('[autocomplete] Redis unavailable — caching disabled'));

const trie = new Trie();
// Seed a small popular-query corpus.
for (const [term, w] of [
  ['react', 900], ['redis', 700], ['redux', 650], ['rest api', 500], ['regex', 300],
  ['node js', 850], ['nginx', 400], ['mongodb', 600], ['mongoose', 350], ['microservices', 450],
] as [string, number][]) trie.insert(term, w);

const app = express();
app.use(express.json());
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/api/autocomplete', async (req, res) => {
  const q = String(req.query.q ?? '').trim().toLowerCase();
  const k = Math.min(20, Math.max(1, Number(req.query.k ?? 5)));
  if (!q) return res.json({ q, suggestions: [] });
  const cacheKey = `ac:${k}:${q}`;
  if (redis?.status === 'ready') {
    const hit = await redis.get(cacheKey).catch(() => null);
    if (hit) return res.json({ q, cached: true, suggestions: JSON.parse(hit) });
  }
  const suggestions = trie.topK(q, k);
  if (redis?.status === 'ready') void redis.set(cacheKey, JSON.stringify(suggestions), 'EX', cacheTtl).catch(() => {});
  res.json({ q, cached: false, suggestions });
});

// Add/boost a term (e.g., a trending query). Invalidate is handled by TTL.
app.post('/api/terms', (req, res) => {
  const term = String(req.body?.term ?? '').trim();
  if (!term) return res.status(400).json({ error: 'term required' });
  trie.bump(term, Number(req.body?.weight ?? 1));
  res.status(201).json({ term });
});

app.listen(port, () => console.log(`[autocomplete] listening on :${port}`));
