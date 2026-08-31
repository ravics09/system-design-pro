# Custom Event Emitter — implementation

A from-scratch `EventEmitter` implementing the [design doc](../03-event-emitter.md) — the Observer /
Pub-Sub pattern behind Node's streams and sockets — with correct semantics, plus a small **SSE demo
server** that uses it as an in-process event bus.

## Stack

- **Node.js + TypeScript** — the emitter is dependency-free (`src/event-emitter.ts`)
- **Express** — a demo server exposing an SSE stream driven by the emitter

## What it demonstrates

- Synchronous, in-order dispatch; multiple + duplicate listeners
- `once()` that removes **before** invoking (safe re-entrancy) and is removable via the original fn
- Snapshotted iteration so `on`/`off` **during** `emit` can't corrupt the loop
- Unhandled `'error'` event throws (Node behavior)
- `MaxListenersExceededWarning` leak guard

## Endpoints (demo)

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Liveness |
| GET | `/api/events` | Subscribe (SSE) — registers a listener; disconnect removes it |
| POST | `/api/emit` `{event,data}` | Emit to all subscribers via the custom emitter |

```bash
# terminal 1
curl -N localhost:3103/api/events
# terminal 2
curl -XPOST localhost:3103/api/emit -H 'content-type: application/json' -d '{"data":"hello"}'
```

## Run it

```bash
docker compose up --build          # http://localhost:3103
npm install && npm test            # 8 unit tests covering all semantics — no deps needed
npm run typecheck
```

## Verification

- `npm test` covers on/emit ordering, `once`, `off` (by original ref), duplicates, remove-during-emit,
  and error-event throw/handled. `npm run typecheck` passes.
