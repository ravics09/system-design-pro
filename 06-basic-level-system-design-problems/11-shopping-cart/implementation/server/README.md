# Shopping Cart — API (NestJS + Mongoose + Zod)

The cart + catalog service. Atomic cart mutations, server-side pricing, and an
oversell-safe, idempotent checkout.

## Layout

```
src/
├── main.ts · app.module.ts · config.ts
├── common/ zod-validation.pipe.ts
├── products/
│   ├── product.schema.ts       # name · priceCents · currency · stock
│   ├── products.service.ts     # list · mapByIds · seed
│   └── products.controller.ts  # GET /products · POST /products/seed
└── carts/
    ├── cart.schema.ts          # ownerKey (unique) · items[{productId,quantity}] · version
    ├── order.schema.ts         # price snapshot + idempotencyKey (unique partial)
    ├── carts.service.ts        # atomic ops · server pricing · merge · checkout  ← the core
    ├── carts.controller.ts     # REST
    └── carts.dto.ts
```

## Endpoints

```http
GET    /products                              catalog
POST   /products/seed                         (dev) reset catalog with stock
GET    /carts/:ownerKey                       cart with SERVER-COMPUTED prices + total
POST   /carts/:ownerKey/items                 { productId, quantity } → add/increment (atomic)
PATCH  /carts/:ownerKey/items/:productId      { quantity } → set (0 removes)
DELETE /carts/:ownerKey/items/:productId      remove
POST   /carts/:ownerKey/merge                 { fromOwnerKey } → sum quantities, discard source
POST   /carts/:ownerKey/checkout              { idempotencyKey? } → order (or 409 out of stock)
```

## Key mechanics

- **Atomic add** — `updateOne({ownerKey,'items.productId'}, { $inc: {'items.$.quantity'} })`; falls back
  to `$push` (with a `$ne` guard) when the line is new. Concurrent "+1"s compose to "+2".
- **Server-side pricing** — the cart never stores a price; `getCart` recomputes from the catalog and
  checkout **snapshots** unit prices onto the order.
- **Oversell-safe checkout** — for each line, an atomic conditional decrement
  `updateOne({ _id, stock: { $gte: qty } }, { $inc: { stock: -qty } })`; if any line fails, previously
  decremented lines are **compensated** (restored) and the request returns `409`.
- **Idempotency** — an order carries an `idempotencyKey` with a unique partial index; a retry with the
  same key returns the existing order (no double decrement / double charge).

## Run

```bash
npm install
cp .env.example .env      # set MONGODB_URI
npm run build && npm start
```

## Notes

- `ownerKey` is taken from the path for demo purposes; for logged-in users derive it from the session/JWT.
- Multi-item checkout uses **compensation** (a mini saga) rather than a multi-document transaction, so it
  works on a standalone MongoDB; with a replica set you could use a transaction instead.
- The hot path (cart reads/writes, inventory counters) belongs in Redis at scale — see the design doc.
- Verified by an end-to-end test against in-memory MongoDB (`mongodb-memory-server` is a transient test
  tool, not a project dependency).
