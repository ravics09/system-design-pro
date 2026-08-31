# Distributed ID Generator (Snowflake) — implementation

A Snowflake-style unique-ID service implementing the [design doc](../05-distributed-id-generator.md):
64-bit, time-sortable, coordination-free ids with clock-skew protection and **Redis-leased worker ids**.

## Stack

- **Node.js + TypeScript + Express**, **BigInt** math (a 64-bit id exceeds JS Number's safe range)
- **Redis** (optional) to lease a unique worker id per instance

## Bit layout

```
[ 1 sign | 41 timestamp ms (epoch 2020) | 10 machine id | 12 sequence ]
```

- 41-bit ms timestamp → ~69 years · 10-bit machine → 1024 nodes · 12-bit sequence → 4096 ids/ms/node

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Liveness + this node's worker id |
| GET | `/api/id` | One id + decoded parts |
| GET | `/api/ids?count=n` | Batch of ids |
| GET | `/api/decode/:id` | Decode an id into `{timestampMs, machineId, sequence}` |

## Design-doc mapping

- **In-process, no per-id coordination** → `Snowflake.nextId()` is pure bit math.
- **Time-sortable** → ids increase with time (great index locality).
- **Clock-backwards protection** → throws if `now < lastMs` (never re-mints a used timestamp).
- **Sequence overflow** → busy-waits to the next millisecond.
- **Worker-id assignment** → leased from Redis (`INCR` mod 1024); falls back to `WORKER_ID` env.

## Run it

```bash
docker compose up --build          # http://localhost:3105
npm install && npm test            # 6 unit tests
npm run typecheck
```

## Verification

- `npm test` covers uniqueness/monotonicity (5000 ids), decode, sequence rollover to next ms, and
  clock-backwards rejection. `npm run typecheck` passes.
