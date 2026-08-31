# Mitigate MongoDB Replication Lag — implementation

Handling replication lag, implementing the [design doc](../32-mongodb-replication-lag.md): per-query
**read preferences**, **majority** write/read concern, and **causally-consistent sessions** for
read-your-writes off secondaries.

## Stack

- **Node.js + TypeScript + Express**
- **MongoDB** (compose runs a **single-node replica set** so read preferences/sessions/concerns apply)

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/items` `{sku, qty}` | Write with `w:majority` (failover-safe) |
| GET | `/api/items/:sku?consistency=strong\|eventual` | Read from primary vs secondaryPreferred |
| POST | `/api/items/:sku/causal-adjust` `{delta}` | Write + read-your-write in a causal session |

## Design-doc mapping

- **Read preference** → `pickReadPreference`: `strong→primary` (read-your-writes), `eventual→
  secondaryPreferred` (scale reads, tolerate lag).
- **Write/read concern** → writes use `w:majority`; primary reads use `readConcern:majority` (no
  rollback-visible data).
- **Causal consistency** → a `causalConsistency` session lets a secondary read reflect the just-written
  value (waits to catch up to the write's cluster time) — the surgical fix for read-your-writes while
  still scaling reads.

## Run it

```bash
docker compose up --build          # http://localhost:3132 (single-node replica set)
```

```bash
npm install && npm test            # 2 unit tests (read-preference mapping)
npm run typecheck
```

## Verification

- `npm test` + `npm run typecheck` pass. Read preferences, majority concerns, and causal sessions run
  against the replica set under `docker compose up`. **Note:** real lag requires multiple data-bearing
  nodes; the API mechanics are identical on a single-node RS.
