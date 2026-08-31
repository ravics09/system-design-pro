# Server — NestJS job/task queue

NestJS (TypeScript, CommonJS) job queue: a broker-agnostic in-memory **engine** plus a concurrent
**worker pool**. No database — jobs live in memory, so `npm install` is all the setup needed.

## Run

> npm is under nvm here; if `npm` is missing, run `export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"` first.

```bash
npm install
npm run build && npm start   # http://localhost:3009
# or hot reload:
npm run start:dev
# type-check only:
npm run typecheck
```

Config is validated at boot by `src/config.ts` (Zod). Copy `.env.example` → `.env` to override:

| Var | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3009` | Listen port. |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed web origin. |
| `WORKER_CONCURRENCY` | `3` | Jobs processed in parallel by the pool. |
| `WORKER_AUTOSTART` | `true` | Consume on boot (`false` = enqueue-only until resumed). |
| `POLL_INTERVAL_MS` | `25` | How often idle workers poll for a job. |
| `VISIBILITY_TIMEOUT_MS` | `30000` | Lease duration; the reaper requeues jobs past this. |
| `BACKOFF_BASE_MS` | `1000` | Retry backoff base (`~base * 2^(attempt-1) + jitter`). |
| `BACKOFF_CAP_MS` | `30000` | Maximum backoff between retries. |
| `MAX_QUEUE_DEPTH` | `10000` | Backpressure: reject enqueue when the backlog exceeds this (→ 503). |

## How the concepts map to code

### The engine — `src/queue/job-queue.ts`
The pure, framework-free core. Two invariants make it crash-safe:

1. **Lease, don't delete.** `lease()` atomically moves the best eligible job (`priority DESC`, then FIFO)
   from `waiting` to `active` and stamps a **visibility timeout**. The job is invisible to other workers
   until it's acked, nacked, or the lease expires. `ack()` marks it completed; only then is the work done.
2. **Reap abandoned leases.** `runMaintenance()` promotes due `delayed` jobs to `waiting` and returns
   `active` jobs whose lease expired (a crashed/stalled worker) back to `waiting` — this is the source of
   **at-least-once** delivery, so handlers should be idempotent.

`nack()` implements **exponential backoff + jitter** (re-schedules as a `delayed` job) until
`maxAttempts`, then **dead-letters** the job. `retryDead()` re-drives a dead job. `enqueue()` enforces
**backpressure** via `MAX_QUEUE_DEPTH` (throws `QueueFullError`).

### The worker pool — `src/worker/worker.service.ts`
A poll loop fills every free concurrency slot by leasing a job and processing it: run the handler → `ack`
on success, `nack` on throw. A heartbeat **extends the lease** so long jobs aren't reaped mid-flight.
Supports `pause`/`resume` and runtime `setConcurrency`. This models N worker processes all leasing from
one broker.

### Handlers — `src/queue/processors.ts`
`getProcessor(type)` resolves a handler (the production "allowlist"). The `demo` handler reads the payload
(`latencyMs`, `failTimes`, `alwaysFail`) so the UI can drive success, retry-then-succeed, and
retry-until-dead paths.

### HTTP surface — `src/queue/queue.controller.ts`, `src/worker/worker.controller.ts`
Enqueue/list/stats/retry/reset and worker controls. `QueueFullError` maps to **503** (tell producers to
back off); validation failures map to **400**.
