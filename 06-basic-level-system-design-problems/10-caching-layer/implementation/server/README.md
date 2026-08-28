# Caching Layer — API (NestJS + Zod)

An in-process **LRU + TTL** cache in front of a simulated slow origin, with
**cache-aside + single-flight** and live **hit/miss metrics**. No external
services required (the origin is an in-memory store with artificial latency).

## Layout

```
src/
├── main.ts · app.module.ts · config.ts   # CACHE_MAX · CACHE_TTL_MS · ORIGIN_LATENCY_MS
├── common/ zod-validation.pipe.ts
├── cache/
│   ├── lru-cache.ts        # Map-order LRU + per-entry TTL (evict LRU, lazy-expire)
│   ├── cache.service.ts    # getOrLoad (cache-aside + single-flight) + metrics  ← the core
│   └── cache.controller.ts # GET /cache/stats · GET /cache/keys · POST /cache/flush
└── items/
    ├── slow-store.ts       # origin with ORIGIN_LATENCY_MS delay + load counter
    ├── items.service.ts    # cache-aside read · write-through update · invalidate
    └── items.controller.ts # GET /items/:id (cached? + ms) · PUT · DELETE
```

## Endpoints

```http
GET  /items                     list items
GET  /items/:id                 cache-aside read → { data, cached, coalesced?, ms }
PUT  /items/:id   { value }      write-through update (keeps cache fresh)
DELETE /items/:id                delete + invalidate
GET  /items/debug/loads          origin read count (proves single-flight)
POST /items/seed                 reset origin (and load counter)
GET  /cache/stats                { hits, misses, sets, evictions, size, hitRatio }
GET  /cache/keys                 current cache keys
POST /cache/flush                clear cache + reset metrics
```

## The core ideas

- **LRU + TTL** (`lru-cache.ts`): a JS `Map` keeps insertion order — the first key is least-recently-used
  (evicted on overflow), `get` re-inserts to mark most-recently-used, and each entry has an `expiresAt`.
- **Cache-aside** (`getOrLoad`): hit → return; miss → load from origin, populate, return. The response's
  `cached`/`ms` fields make the miss-vs-hit latency gap visible.
- **Single-flight**: concurrent misses for the same key await **one** in-flight origin load (stampede
  protection) — `/items/debug/loads` proves N concurrent reads cause 1 origin load.
- **Write-through**: `PUT` writes the origin then refreshes the cache entry, so the next read is a fresh
  hit (no stale data). `DELETE` invalidates.

## Run

```bash
npm install
cp .env.example .env
npm run build && npm start      # http://localhost:3007
```

Tune `ORIGIN_LATENCY_MS` (miss/hit gap), `CACHE_MAX` (eviction), `CACHE_TTL_MS` (expiry).

## Notes

- The origin is in-memory so the demo runs with zero external dependencies; in production this cache-aside
  logic sits in front of a real DB, and the in-process cache is an **L1** in front of a distributed **L2**
  (Redis) — see the design doc.
- Verified by an end-to-end test (plain Node, no external services).
