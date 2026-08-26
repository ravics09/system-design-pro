# Real-Time Notification System — Full-Stack Reference Implementation

A runnable, full-stack implementation of the design in
[`../08-notification-feed.md`](../08-notification-feed.md).

```
implementation/
├── server/   # NestJS + Socket.IO + Mongoose + Zod  — WebSocket gateway + fan-out API
└── web/      # Next.js + React + Redux Toolkit (RTK Query) + socket.io-client — live bell + list
```

## What it demonstrates

- **Real-time delivery** over WebSocket: an emit reaches the user's open device **instantly** (no poll).
- **Rooms per user** (`user:<id>`) + a **config-gated Redis adapter** so delivery works across many
  gateway instances — the mechanism for scaling to millions of connections.
- **Fan-out** to one or many users; **idempotent** persistence (dedupe key) for at-least-once delivery.
- **O(1) unread counter** (Redis/in-memory) + **mark one / all read**; cursor-paginated history.
- **Live UI**: socket events are injected straight into the RTK Query cache, so the bell badge and list
  update with no refetch.

## Run locally

Node ≥ 20 and a MongoDB instance required (Redis optional — needed only for multi-instance scale-out).

```bash
# 1) API + WebSocket gateway
cd server
npm install
cp .env.example .env
npm run build && npm start     # http://localhost:3004

# 2) Web (another terminal)
cd web
npm install
cp .env.example .env.local     # NEXT_PUBLIC_API_BASE_URL=http://localhost:3004
npm run dev                    # http://localhost:3000
```

Open the app, click a **Simulate** button, and watch the bell badge + list update live. Open a second
tab (same user) to see multi-device delivery.

## Verification

- **Server**: `npm run typecheck`, `nest build`, and a **13-case end-to-end test** using a real
  `socket.io-client` + in-memory MongoDB: socket connect + room join, **real-time delivery of an emit**,
  persistence, O(1) unread count, idempotent dedupe, mark one/all read, broadcast fan-out, unauthenticated
  socket rejection, and validation.
- **Web**: `next build` (compiles + type-checks + prerenders) and `tsc --noEmit` both pass.

See each subfolder's README for details.
