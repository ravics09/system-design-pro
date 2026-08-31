# Intermediate Problems — Implementations

Every problem in this section now ships a **production-shaped, dockerized implementation** under its
`implementation/` folder, alongside the design doc. Each is a self-contained **Node.js + TypeScript**
service with a `Dockerfile`, `docker-compose.yml` (wiring any Redis/MongoDB it needs), `.env.example`,
core **unit tests**, and a per-app `README.md` mapping the code back to the design doc.

## How to run any implementation

```bash
cd <NN-problem>/implementation
cp .env.example .env
docker compose up --build      # app + its datastores

# or locally (Node 20+):
npm install
npm run dev        # tsx watch
npm test           # unit tests (no datastore needed)
npm run typecheck  # tsc --noEmit
```

## The 35 implementations

| # | Problem | Port | Datastores | Core technique |
| --- | --- | --- | --- | --- |
| 01 | Real-Time Chat System | 3101 | Redis, MongoDB | Socket.IO + Redis adapter fan-out; idempotent delivery |
| 02 | Who's Online | 3102 | Redis | Heartbeat + TTL soft-state presence (ZSET by expiry) |
| 03 | Event Emitter | 3103 | — | From-scratch EventEmitter + SSE demo |
| 04 | Parking Lot (LLD) | 3104 | — | OOP best-fit allocation + Strategy pricing |
| 05 | Distributed ID Generator | 3105 | Redis (optional) | Snowflake (BigInt) + worker-id lease + clock-skew guard |
| 06 | Like / Reaction System | 3106 | Redis, MongoDB | Idempotency set + atomic counters + write-behind |
| 07 | Web Crawler | 3107 | Redis, MongoDB | Frontier + seen-set + per-host politeness + robots.txt |
| 08 | Leaderboard | 3108 | Redis | Sorted sets: top-N / rank / around-me + tie-break |
| 09 | Flash Sale | 3109 | Redis, MongoDB | Atomic Lua reserve (no oversell) + reservation TTL |
| 10 | Task Scheduler | 3110 | Redis | ZSET fire-time + atomic Lua claim (exactly-once) + cron |
| 11 | Tagging System | 3111 | MongoDB | Multikey tag index + `$all` + keyset pagination |
| 12 | File Processing Pipeline | 3112 | Redis, MongoDB | Producer/consumer queue + workers + lease/requeue |
| 13 | Autocomplete / Typeahead | 3113 | Redis | Trie top-k by popularity + result cache |
| 14 | Optimistic Locking (Mongoose) | 3114 | MongoDB | `optimisticConcurrency` (`__v`) + retry-on-conflict |
| 15 | Centralized Logging | 3115 | MongoDB | Async batched ingestion + trace correlation + redaction |
| 16 | API Gateway | 3116 | — | Reverse proxy + routing + edge auth + token-bucket limit |
| 17 | Ticket Booking Concurrency | 3117 | MongoDB | Atomic conditional hold (free→held) + TTL + confirm |
| 18 | Social Media Feed | 3118 | Redis, MongoDB | Hybrid fan-out (push + celebrity pull) |
| 19 | Geo-Spatial Search | 3119 | Redis | Redis GEO `GEOSEARCH` nearby + Haversine |
| 20 | Circuit Breaker | 3120 | — | Closed/Open/Half-Open state machine + fallback |
| 21 | Unread Message Counter | 3121 | Redis, MongoDB | O(1) counters + durable read watermark |
| 22 | AsyncLocalStorage Context | 3122 | — | Request context via `async_hooks`, no cross-request bleed |
| 23 | Distributed Session Store | 3123 | Redis | `express-session` + `connect-redis`, stateless app tier |
| 24 | Database Views (Materialized) | 3124 | MongoDB | `$merge` materialized view + scheduled refresh |
| 25 | Image Optimization Pipeline | 3125 | — (disk) | `sharp` on-the-fly resize/encode + param-hash cache |
| 26 | Cache Invalidation | 3126 | Redis, MongoDB | Write-then-invalidate + versioned keys + TTL backstop |
| 27 | Polling vs WebSockets | 3127 | — | Short/long poll + SSE + WebSocket, one data source |
| 28 | Cursor-Based Search Aggregation | 3128 | MongoDB | `$all` token match + keyset cursor |
| 29 | Live CMS Workflow | 3129 | MongoDB | FSM (draft→review→scheduled→published) + scheduled publish |
| 30 | Worker Threads | 3130 | — | `worker_threads` pool offloads CSV parse/aggregate |
| 31 | Real-Time Polling App | 3131 | Redis | Atomic vote counters + pub/sub → SSE live results |
| 32 | MongoDB Replication Lag | 3132 | MongoDB (RS) | Read preferences + majority concern + causal session |
| 33 | Audit Trail System | 3133 | MongoDB | Before/after diffs + append-only hash-chained log |
| 34 | Idempotent API Endpoints | 3134 | MongoDB | Idempotency-Key insert-first + stored-response replay |
| 35 | Rate-Limited Third-Party Proxy | 3135 | Redis | Shared token bucket + cache + single-flight |

## Conventions

- **Stack:** Node.js 20 + TypeScript (strict) + Express; `ioredis` / `mongoose` where a datastore is
  needed; `tsx` for dev + the built-in test runner for unit tests.
- **Docker:** multi-stage `node:20-alpine` images with a `/api/health` `HEALTHCHECK`; `docker-compose.yml`
  brings up the app plus its datastores.
- **Testing:** each app has fast, dependency-free **unit tests** for its core logic (`npm test`) and
  passes `tsc --noEmit`. Datastore-backed flows run under `docker compose up`.

> Note: `docker compose` commands are for local use. In this repo's CI sandbox, apps were verified via
> `npm run typecheck` + `npm test`; the real-time chat service was additionally smoke-tested end-to-end
> against live Redis + MongoDB containers.
