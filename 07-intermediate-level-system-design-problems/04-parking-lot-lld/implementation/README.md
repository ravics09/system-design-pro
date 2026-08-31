# Parking Lot (LLD) — implementation

An object-oriented parking-lot design implementing the [design doc](../04-parking-lot-lld.md): sized
vehicles/spots, multi-level **best-fit allocation**, tickets, and pluggable **Strategy** pricing, exposed
over a small REST API.

## Stack

- **Node.js + TypeScript + Express** (in-memory domain model — no DB needed)

## Design (mapped to the doc)

- **Domain model** (`src/domain.ts`): `Size` enum with a `canFit` rule (a vehicle fits any spot ≥ its
  size) — avoids a class explosion of vehicle/spot subtypes.
- **Allocation** (`src/parking-lot.ts`): per-size free-spot stacks → O(1) best-fit (exact size first, then
  spill to the next larger). A synchronous `pop()` is atomic in single-threaded Node → **no
  double-booking**.
- **Strategy pattern**: `PricingStrategy` (`HourlyPricing` rounds up, 1h minimum) is swappable without
  touching the lot.
- **Tickets**: issued on entry, priced + freed on exit; unknown/closed tickets are handled safely.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Liveness |
| GET | `/api/availability` | Free/total spots by level |
| POST | `/api/park` `{plate,size}` | Allocate a spot → ticket (409 if full) |
| POST | `/api/unpark` `{ticketId}` | Free the spot → `{feeCents,durationMs}` |

`size` is one of `motorcycle`, `compact`, `large`.

## Run it

```bash
docker compose up --build          # http://localhost:3104
npm install && npm test            # 7 unit tests (best-fit, overflow, no double-book, pricing)
npm run typecheck
```

## Verification

- `npm test` covers `canFit`, best-fit, size overflow + full rejection, distinct-spot allocation, pricing
  round-up, and idempotent-safe unpark. `npm run typecheck` passes.
