# Caching Layer — Web (Next.js + Redux Toolkit)

A dashboard that makes the cache visible: fetch items and see **HIT/MISS + latency**
per read, with a live **hit-ratio** stats panel — using **RTK Query**.

## Layout

```
src/
├── app/ layout.tsx · page.tsx
├── components/
│   ├── ItemsPanel.tsx    # per-item Fetch → HIT/MISS + ms badge; +1 write-through
│   └── StatsPanel.tsx    # hit ratio bar + hits/misses/size/evictions; flush/reset
├── store/
│   ├── cacheApi.ts       # RTK Query: getItems / getStats / readItem / updateItem / flush / seed
│   ├── store.ts
│   └── Providers.tsx
└── types.ts
```

## Why `readItem` is a mutation

We want **every** click to hit the server so the real hit/miss + latency shows —
so `readItem` is modeled as an RTK Query **mutation** (mutations always execute
and aren't client-cached), and it **invalidates** the `Stats` tag so the metrics
panel refreshes. `getStats` polls every second for a live hit-ratio bar.

## Try it

1. **Fetch** an item → **MISS** (slow, ~origin latency).
2. **Fetch** it again → **HIT** (fast, sub-ms) and the hit ratio climbs.
3. **+1 (write-through)** → value updates and the next read is still a fresh **HIT**.
4. **Flush cache** → the next fetch is a **MISS** again.

## Run

```bash
npm install
cp .env.example .env.local     # NEXT_PUBLIC_API_BASE_URL=http://localhost:3007
npm run dev                    # http://localhost:3000
```

The API (in `../server`) must be running.

## Verify

```bash
npm run typecheck      # tsc --noEmit
npm run build          # next build (also type-checks)
```
