# Polling vs WebSockets — implementation

A live delivery-tracking demo implementing the [design doc](../27-polling-vs-websockets-system.md): the
**same moving position** is exposed over **short polling, long polling, SSE, and WebSockets** so you can
contrast their footprints.

## Stack

- **Node.js + TypeScript + Express** (+ `ws` for WebSockets)

## Endpoints (four transports, one data source)

| Transport | Endpoint | Behavior |
| --- | --- | --- |
| Short poll | `GET /api/poll` | Returns current state each call (wasteful if unchanged) |
| Long poll | `GET /api/longpoll?since=V` | Holds until state newer than `V` (or ~25s timeout) |
| SSE | `GET /api/stream` | One long-lived stream, server pushes each update |
| WebSocket | `ws://…/ws` | Full-duplex; pushes each update |

## Design-doc mapping

- **Versioned state** → each update bumps a monotonic `version`; long-poll waits for `version > since`,
  clients skip stale updates.
- **SSE for one-way live data** → the natural fit for a tracking dashboard (cheap, auto-reconnect via
  `id:`/Last-Event-ID).
- **WebSocket** → shown for when the client must also send data (full-duplex).
- **Coalesce** → `coalesce()` keeps only the latest of a burst (push the newest position, not every tick).

## Run it

```bash
docker compose up --build          # http://localhost:3127
curl localhost:3127/api/poll
curl -N localhost:3127/api/stream      # SSE
curl "localhost:3127/api/longpoll?since=0"
```

```bash
npm install && npm test            # 4 unit tests (versioning, since semantics, emit, coalesce)
npm run typecheck
```

## Verification

- `npm test` covers monotonic versioning, long-poll `since` semantics, update events, and burst coalescing.
  `npm run typecheck` passes. All four transports run under `docker compose up`.
