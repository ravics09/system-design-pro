# Shopping Cart — Web (Next.js + Redux Toolkit)

A storefront that lists products, manages a cart, and checks out — using **RTK
Query** for data fetching and cache invalidation. All prices/totals come from the
server (the client never computes money).

## Layout

```
src/
├── app/
│   ├── layout.tsx        # wraps the app in the Redux <Providers>
│   └── page.tsx          # ProductGrid + CartPanel
├── components/
│   ├── ProductGrid.tsx   # catalog + Add to cart
│   └── CartPanel.tsx     # qty controls, server-computed total, checkout
├── store/
│   ├── cartApi.ts        # RTK Query: products / cart / add / setQty / remove / checkout  ← the core
│   ├── store.ts
│   └── Providers.tsx
├── lib/money.ts          # formatCents (integer-cents money formatting)
└── types.ts
```

## How it works

Cart mutations (`addItem`, `setQty`, `removeItem`, `checkout`) **invalidate** the
`Cart` tag, so `getCart` re-fetches with fresh **server-computed** line totals and
grand total. Checkout sends an **idempotency key** so a retried request can't
create a duplicate order. Out-of-stock checkouts surface the API's `409` message.

## Run

```bash
npm install
cp .env.example .env.local     # NEXT_PUBLIC_API_BASE_URL=http://localhost:3005
npm run dev                    # http://localhost:3000
```

The API (in `../server`) must be running and seeded (`POST /products/seed`).

## Verify

```bash
npm run typecheck      # tsc --noEmit
npm run build          # next build (also type-checks)
```
