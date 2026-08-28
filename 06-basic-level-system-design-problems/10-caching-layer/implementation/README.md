# Caching Layer System — Full-Stack Reference Implementation

A runnable, full-stack implementation of the design in
[`../10-caching-layer.md`](../10-caching-layer.md).

```
implementation/
├── server/   # NestJS + Zod  — LRU+TTL cache, cache-aside + single-flight, live metrics
└── web/      # Next.js + React + Redux Toolkit (RTK Query) — hit/miss + latency dashboard
```

## What it demonstrates

- **Cache-aside** reads with a visible **miss (slow) → hit (fast)** latency gap.
- **LRU + TTL** eviction (bounded capacity, per-entry expiry).
- **Single-flight** stampede protection: N concurrent misses → **one** origin load.
- **Write-through** (fresh cache after a write) and **invalidation** on delete.
- Live **metrics**: hits, misses, hit ratio, size, evictions.

## Run locally

Node ≥ 20 (no database or Redis needed — the origin is an in-memory slow store).

```bash
# 1) API
cd server
npm install
cp .env.example .env
npm run build && npm start                 # http://localhost:3007

# 2) Web (another terminal)
cd web
npm install
cp .env.example .env.local                 # NEXT_PUBLIC_API_BASE_URL=http://localhost:3007
npm run dev                                # http://localhost:3000
```

Fetch an item (MISS, slow), fetch again (HIT, fast), watch the hit ratio climb; flush to miss again.

## Verification

- **Server**: `npm run typecheck`, `nest build`, and a **15-case end-to-end test** (plain Node):
  miss/hit latency gap, hit/miss metrics, **write-through freshness**, **delete invalidation**,
  **TTL expiry**, **single-flight** (10 concurrent misses → 1 origin load), **LRU eviction**, and flush.
- **Web**: `next build` (compiles + type-checks + prerenders) and `tsc --noEmit` both pass.

See each subfolder's README for details. The in-process cache here maps to an **L1 near cache**; in
production it sits in front of a distributed **L2** (Redis/ElastiCache) — covered in the design doc.
