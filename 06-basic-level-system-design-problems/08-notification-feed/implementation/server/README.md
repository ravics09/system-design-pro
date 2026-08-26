# Real-Time Notifications — API (NestJS + Socket.IO + Mongoose + Zod)

The connection + fan-out tier: an authenticated WebSocket gateway plus a REST
surface for emitting, reading history, unread counts, and mark-read.

## Layout

```
src/
├── main.ts                       # bootstrap + optional Redis WS adapter (scale-out)
├── app.module.ts
├── config.ts                     # zod env; userRoom() helper
├── redis-io.adapter.ts           # config-gated multi-instance fan-out adapter
├── common/ zod-validation.pipe.ts
└── notifications/
    ├── notification.schema.ts     # per-user record + indexes + unique dedupe key
    ├── notifications.gateway.ts    # authed handshake → join user:<id>; emitToUser  ← real-time
    ├── notifications.service.ts    # persist (idempotent), unread counter, fan-out, cursor list, markRead
    ├── notifications.controller.ts # REST: emit / broadcast / list / unread-count / mark-read
    ├── notifications.dto.ts        # Zod schemas + view types
    └── unread.store.ts             # O(1) unread counter (redis | memory)
```

## WebSocket

```
connect  ws://<host>  handshake auth: { token: <userId> }   // JWT in production
         → server verifies, socket.join("user:<userId>")
server → client event 'notification'  { id, type, payload, ... }
```

The server pins each socket to `user:<authenticatedId>` — a client can never subscribe to someone
else's channel. With `SOCKET_ADAPTER=redis`, `server.to(room).emit()` is broadcast across **all**
gateway instances via Redis Pub/Sub, so any worker can reach a user's socket wherever it lives.

## REST

```http
POST /notifications             { userId, type, actorId?, entityId?, payload?, dedupeKey? }  → 201
POST /notifications/broadcast   { userIds[], type, ... }                                     → { delivered }
GET  /notifications?userId=&limit=&cursor=      cursor-paginated history
GET  /notifications/unread-count?userId=        → { count }   (O(1))
POST /notifications/mark-read   { userId, ids?[] | all?:true } → { count }
GET  /health
```

## Key mechanics

- **Idempotency** — `dedupeKey` + a unique sparse index mean re-emitting the same logical notification
  is a no-op (no double count, no double emit) → safe at-least-once delivery.
- **Unread counter** — kept in `UnreadStore` (Redis/in-memory), `incr` on emit, `decr`/`reset` on
  read; the badge never runs `countDocuments()`.
- **Fan-out** — `emitToMany` iterates here for clarity; at scale it's async + batched off a queue with
  real-time emit limited to online users (see the design doc).

## Run

```bash
npm install
cp .env.example .env      # MONGODB_URI; SOCKET_ADAPTER=memory works single-instance
npm run build && npm start
```

## Notes

- Handshake auth uses the userId as a demo token; swap for real JWT verification in `notifications.gateway.ts`.
- Verified by an end-to-end test with a real `socket.io-client` + in-memory MongoDB. `mongodb-memory-server`
  and `socket.io-client` are transient test tools, not project dependencies.
