# Server — catalog engine (NestJS + Zod)

Products with option types, Cartesian **variant/SKU generation**, per-SKU price (cents) + stock,
selection→variant resolution, and atomic inventory. No database.

## Run

> npm is under nvm here; if `npm` is missing, run `export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"` first.

```bash
npm install
npm run build && npm start   # http://localhost:3012
npm run start:dev
npm run typecheck
```

Config (`.env`): `PORT` (3012), `CORS_ORIGIN`, `MAX_VARIANTS` (combinatorial-explosion guard).

## How it maps to the concepts

- `engine/variants.ts` — `cartesian()` generates every option combination; `skuCode()` builds a SKU;
  `selectionKey()` normalizes a selection into an order-independent key for O(1) resolution;
  `variantCount()` powers the explosion guard.
- `engine/catalog.ts` — `CatalogEngine`: `createProduct` generates the matrix (unique SKUs + a
  per-product selection index), `resolve` maps a selection to one variant, `updateVariant` edits
  price/stock, `adjustStock` is **atomic and refuses to go negative** (no oversell → `InsufficientStockError`),
  `filterByOption` finds products by option value. Prices are integer **cents**.
- `engine/catalog.types.ts` — types + Zod schemas.
