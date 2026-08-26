# Shopping Cart System — Full-Stack Reference Implementation

A runnable, full-stack implementation of the design in
[`../11-shopping-cart.md`](../11-shopping-cart.md).

```
implementation/
├── server/   # NestJS + Mongoose + Zod  — cart + catalog + oversell-safe checkout
└── web/      # Next.js + React + Redux Toolkit (RTK Query) — storefront + cart
```

## What it demonstrates

- **Guest & user carts** keyed by `ownerKey` (`guest:<session>` / `user:<id>`), with **merge on login**.
- **Atomic item mutations** (`$inc`) so concurrent add-to-cart requests never lose updates.
- **Server-side pricing**: the cart stores only `productId` + `quantity`; prices/totals are computed
  from the catalog on read and **snapshotted** into the order at checkout — clients can't spoof prices.
- **Oversell-safe checkout**: an **atomic conditional decrement** (`stock >= qty`) with **compensation**
  (roll back partial reservations) and an **idempotency key** (no duplicate orders on retry).

## Run locally

Node ≥ 20 and a MongoDB instance required.

```bash
# 1) API
cd server
npm install
cp .env.example .env
npm run build && npm start                       # http://localhost:3005
curl -X POST localhost:3005/products/seed        # seed the catalog

# 2) Web (another terminal)
cd web
npm install
cp .env.example .env.local                       # NEXT_PUBLIC_API_BASE_URL=http://localhost:3005
npm run dev                                       # http://localhost:3000
```

Add products to the cart, adjust quantities, and checkout — totals come from the server, and stock
decrements atomically (try to over-order the low-stock item to see a 409).

## Verification

- **Server**: `npm run typecheck`, `nest build`, and a **20-case end-to-end test** (in-memory MongoDB):
  atomic add/increment, server-side pricing (client price ignored), update/remove, guest→user merge
  (summed quantities), checkout (stock decrement + cart clear), **oversell → 409 with stock restored**,
  and **idempotent checkout** (same key → same order, no double-decrement).
- **Web**: `next build` (compiles + type-checks + prerenders) and `tsc --noEmit` both pass.

See each subfolder's README for details.
