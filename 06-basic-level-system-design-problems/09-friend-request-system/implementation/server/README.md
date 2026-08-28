# Friend Request — API (NestJS + Mongoose + Zod)

The relationship graph + state machine. One row per pair (single-edge model)
with a canonical pair key, so a pair can never have duplicate/half rows.

## Layout

```
src/
├── main.ts · app.module.ts · config.ts   # config exposes pairKey(a,b)
├── common/ zod-validation.pipe.ts
├── users/                                  # handle-as-_id users + seed
└── friendships/
    ├── friendship.schema.ts                # requesterId · addresseeId · status · pairKey (unique)
    ├── friendships.service.ts              # the state machine  ← the core
    ├── friendships.controller.ts           # REST
    └── friendships.dto.ts
```

## Endpoints

```http
GET  /users                                 directory
POST /users/seed                            (dev) seed alice/bob/carol/dave/erin
POST /friendships/request   { from, to }                     → REQUEST_SENT | FRIENDS (auto-accept) | 4xx
POST /friendships/respond   { userId, otherId, action }      accept | decline
POST /friendships/cancel    { userId, otherId }              cancel own outgoing
POST /friendships/unfriend  { userId, otherId }
POST /friendships/block     { userId, otherId }
POST /friendships/unblock   { userId, otherId }
GET  /friendships/:userId/overview                           { friends, incoming, outgoing, blocked, blockedBy }
GET  /friendships/:userId/status/:otherId                    perspective status
```

## The state machine

```
NONE ──request──▶ PENDING ──accept──▶ ACCEPTED ──unfriend──▶ NONE
                    │  ▲ (reverse request → AUTO-ACCEPT)
                    │  └───── re-send ────── DECLINED
                    └─decline─▶ DECLINED     (cancel ▶ NONE)
any ──block──▶ BLOCKED ──unblock(blocker)──▶ NONE
```

- **Canonical pair key** `pairKey(a,b) = [a,b].sort().join(':')` with a **unique index** → one row per
  pair, duplicate-proof under concurrency.
- **Auto-accept**: a request that meets a reverse `PENDING` short-circuits to `ACCEPTED`.
- **Duplicate-key resolution**: a lost insert race re-reads the row and applies the state machine.
- **Block** overwrites the pair to `BLOCKED` (blocker = requester); blocked users can't send (403);
  only the blocker can unblock.
- **Authorization**: only the addressee can respond, only the requester can cancel — here the acting
  user is passed in the body for the demo; in production it comes from the authenticated session.

## Real-time

`publish(event, payload)` is a logged stub representing an enqueue to the
[notification service](../../08-notification-feed/08-notification-feed.md) (WebSocket push) on
`friend_request_received` / `friend_request_accepted`.

## Run

```bash
npm install
cp .env.example .env      # set MONGODB_URI
npm run build && npm start
curl -X POST localhost:3006/users/seed
```

## Notes

- Users use a human handle as `_id` for a deterministic demo; production would use ObjectId/UUID.
- The single-edge model can't represent a *mutual* block cleanly (one row) — a separate `blocks`
  collection or two rows would; noted as an extension.
- Verified by an end-to-end test against in-memory MongoDB (`mongodb-memory-server` is a transient test
  tool, not a project dependency).
