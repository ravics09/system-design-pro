# Optimistic Locking in Mongoose — implementation

Optimistic concurrency control implementing the [design doc](../14-optimistic-locking-mongoose.md):
version-guarded (`__v`) updates that detect the **lost-update** race and retry, plus an **atomic
conditional-update** alternative.

## Stack

- **Node.js + TypeScript + Express**
- **MongoDB (Mongoose)** with `optimisticConcurrency: true`

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/items` `{sku, qty}` | Create an item |
| GET | `/api/items/:sku` | Read (includes `__v`) |
| PATCH | `/api/items/:sku/adjust` `{delta}` | **Optimistic** read-modify-write + retry-on-conflict |
| PATCH | `/api/items/:sku/adjust-atomic` `{delta}` | Single atomic `$inc` (no RMW window) |

## Design-doc mapping

- **Lost update prevented** → `optimisticConcurrency` makes `.save()` add `WHERE __v = loaded` and bump
  `__v`; a stale save throws `VersionError`.
- **Retry** → `retryOnConflict` retries only on version conflicts (jittered backoff), gives up with a 409,
  and never retries genuine errors.
- **Atomic alternative** → `$inc` in one conditional update sidesteps the RMW window for simple deltas.

## Run it

```bash
docker compose up --build          # http://localhost:3114
```

```bash
npm install && npm test            # 4 unit tests (conflict detection + retry semantics)
npm run typecheck
```

## Verification

- `npm test` covers conflict detection, retry-then-succeed, give-up-after-max (409), and no-retry on real
  errors. `npm run typecheck` passes. Version-conflict behavior runs against Mongo under `docker compose
  up`.
