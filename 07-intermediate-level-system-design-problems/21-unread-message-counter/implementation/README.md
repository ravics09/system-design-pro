# Unread Message Counter — implementation

Scalable unread badges implementing the [design doc](../21-unread-message-counter.md): O(1) **Redis
counters** (per-conversation + total) with a durable **Mongo last-read watermark** for multi-device
correctness — never a `COUNT(*)` per screen load.

## Stack

- **Node.js + TypeScript + Express**
- **Redis** — `unread:{user}` hash (conversation → count)
- **MongoDB** — per-(user,conversation) `lastReadMessageId` watermark

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/deliver` `{userId, conversationId}` | Increment on delivery (O(1) `HINCRBY`) |
| POST | `/api/read` `{userId, conversationId, lastReadMessageId}` | Reset counter + advance watermark |
| GET | `/api/badge/:userId` | Per-conversation counts + total (O(1)) |
| GET | `/api/watermarks/:userId` | Durable read watermarks |

## Design-doc mapping

- **No `COUNT(*)`** → the badge is a single Redis hash read; increments are O(1) `HINCRBY`.
- **Watermark** → durable `lastReadMessageId` per (user, conversation) is the multi-device source of
  truth and the basis for reconciling drifted counters.
- **Multi-device** → reading on any device advances the shared watermark and zeroes the conversation
  counter.

## Run it

```bash
docker compose up --build          # http://localhost:3121
```

```bash
npm install && npm test            # 3 unit tests (sum + clamp)
npm run typecheck
```

## Verification

- `npm test` covers total summation (with string coercion + negatives ignored) and non-negative clamping.
  `npm run typecheck` passes. Counter + watermark flows run against Redis + Mongo under `docker compose
  up`.
