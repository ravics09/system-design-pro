# Friend Request System — Full-Stack Reference Implementation

A runnable, full-stack implementation of the design in
[`../09-friend-request-system.md`](../09-friend-request-system.md).

```
implementation/
├── server/   # NestJS + Mongoose + Zod  — relationship graph + state machine
└── web/      # Next.js + React + Redux Toolkit (RTK Query) — people directory + tabs
```

## What it demonstrates

- **Single-edge model**: one row per pair with a **canonical pair key + unique index** — duplicate- and
  race-proof.
- **State machine**: NONE → PENDING → ACCEPTED / DECLINED, plus BLOCKED; **auto-accept** when both users
  request each other.
- **Correct authorization**: only the addressee responds, only the requester cancels, only the blocker
  unblocks; **blocked users can't send** (403).
- **Real-time hook**: domain events (`friend_request_received` / `accepted`) are published for the
  [notification service](../../08-notification-feed/08-notification-feed.md) to deliver.
- **UI**: contextual actions per relationship status + Friends/Incoming/Outgoing tabs, driven by one
  RTK Query overview with tag invalidation.

## Run locally

Node ≥ 20 and a MongoDB instance required.

```bash
# 1) API
cd server
npm install
cp .env.example .env
npm run build && npm start                 # http://localhost:3006
curl -X POST localhost:3006/users/seed

# 2) Web (another terminal)
cd web
npm install
cp .env.example .env.local                 # NEXT_PUBLIC_API_BASE_URL=http://localhost:3006
npm run dev                                # http://localhost:3000
```

Switch `NEXT_PUBLIC_USER_ID` (e.g. `alice` / `bob`) in two browsers to see both sides of a request.

## Verification

- **Server**: `npm run typecheck`, `nest build`, and a **24-case end-to-end test** (in-memory MongoDB):
  send/accept/decline/cancel/unfriend, **mutual-pending auto-accept**, idempotent duplicate, **block →
  403 + BLOCKED_BY**, blocker-only unblock, self-request `400`, and overview/status.
- **Web**: `next build` (compiles + type-checks + prerenders) and `tsc --noEmit` both pass.

See each subfolder's README for details.
