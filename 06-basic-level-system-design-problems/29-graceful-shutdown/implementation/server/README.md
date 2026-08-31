# Server — graceful shutdown (NestJS)

A lifecycle manager + in-flight tracking + liveness/readiness probes that drain in-flight requests on
SIGTERM. No database.

## Run

> npm is under nvm here; if `npm` is missing, run `export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"` first.

```bash
npm install
npm run build && npm start   # http://localhost:3016
npm run start:dev
npm run typecheck
```

Config (`.env`): `PORT` (3016), `CORS_ORIGIN`, `PRESTOP_MS` (500 — keep serving while the LB
de-registers), `DRAIN_DEADLINE_MS` (10000 — force termination if in-flight doesn't finish).

## How it maps to the concepts

- `lifecycle/lifecycle.manager.ts` — the pure state machine: `running → draining → terminated`, an
  in-flight counter, and `beginShutdown()` (idempotent) that fails readiness → waits out `PRESTOP_MS` →
  drains in-flight to zero (up to `DRAIN_DEADLINE_MS`, else **forced**) → closes resources → terminated.
- `lifecycle/inflight.middleware.ts` — counts in-flight requests; once draining, **new** requests get
  `503 + Retry-After` while in-flight ones finish. Control/health paths are exempt.
- `lifecycle/health.controller.ts` — **liveness** stays 200 while draining (don't get restarted);
  **readiness** returns 503 while draining (LB removes from rotation).
- `main.ts` — real `SIGTERM`/`SIGINT` handlers call `beginShutdown` then `app.close()` and exit; the demo
  `POST /shutdown` models the signal so the web UI can trigger it.
