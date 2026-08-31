import express from 'express';
import { Redis } from 'ioredis';
import { isValidCoord } from './geo';

const port = Number(process.env.PORT ?? 3119);
const redis = new Redis(process.env.REDIS_URL ?? 'redis://127.0.0.1:6379');
const KEY = 'drivers';

const app = express();
app.use(express.json());
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// High-frequency location update (cheap GEOADD — ideal for moving objects).
app.put('/api/drivers/:id/location', async (req, res) => {
  const lng = Number(req.body?.lng);
  const lat = Number(req.body?.lat);
  if (!isValidCoord(lng, lat)) return res.status(400).json({ error: 'valid {lng, lat} required' });
  await redis.geoadd(KEY, lng, lat, req.params.id);
  res.json({ id: req.params.id, lng, lat });
});

app.delete('/api/drivers/:id', async (req, res) => {
  await redis.zrem(KEY, req.params.id);
  res.json({ ok: true });
});

// Nearby search: /api/nearby?lng=&lat=&radiusKm=&count=
app.get('/api/nearby', async (req, res) => {
  const lng = Number(req.query.lng);
  const lat = Number(req.query.lat);
  const radiusKm = Math.max(0.01, Number(req.query.radiusKm ?? 3));
  const count = Math.min(100, Math.max(1, Number(req.query.count ?? 10)));
  if (!isValidCoord(lng, lat)) return res.status(400).json({ error: 'valid lng/lat required' });
  // GEOSEARCH returns members sorted by distance, with distance + coordinates.
  const rows = (await redis.call(
    'GEOSEARCH', KEY, 'FROMLONLAT', String(lng), String(lat),
    'BYRADIUS', String(radiusKm), 'km', 'ASC', 'COUNT', String(count),
    'WITHCOORD', 'WITHDIST',
  )) as [string, string, [string, string]][];
  const results = rows.map(([id, dist, [dlng, dlat]]) => ({
    id, distanceKm: Number(dist), lng: Number(dlng), lat: Number(dlat),
  }));
  res.json({ center: { lng, lat }, radiusKm, results });
});

app.listen(port, () => console.log(`[geo] listening on :${port}`));
