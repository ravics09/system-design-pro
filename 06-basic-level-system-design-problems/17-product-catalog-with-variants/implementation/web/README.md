# Web — storefront (Next.js + RTK Query)

Browse the catalog, pick options to **resolve a live SKU** (price + stock update as you choose), edit the
variant matrix inline, and create a product to watch its variants generate.

## Run

> npm is under nvm here; if `npm` is missing, run `export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"` first.

Start the API first (see [`../server/README.md`](../server/README.md)), then:

```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_BASE_URL=http://localhost:3012
npm install
npm run dev                  # http://localhost:3000
npm run build && npm run typecheck
```

## How it works

- `src/store/catalogApi.ts` — RTK Query slice: `getProducts`/`getProduct` queries; `resolveVariant`,
  `createProduct`, `updateVariant`, `adjustStock`, `reset` mutations (tag-invalidated per product).
- `src/components/Catalog.tsx` — the catalog grid (price range, in-stock, variant/option badges) + reset.
- `src/components/ProductPanel.tsx` — option pickers that resolve to a live SKU (buy decrements stock),
  plus the full variant matrix with inline price/stock editing.
- `src/components/CreateProductForm.tsx` — title/brand/price + dynamic option types; shows the projected
  variant count before you create.
