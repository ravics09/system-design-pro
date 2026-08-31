# Web — indexing console (Next.js + RTK Query)

Build a query, create indexes, and watch the **EXPLAIN** change from a full scan to an index scan.

## Run

> npm is under nvm here; if `npm` is missing, run `export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"` first.

Start the API first (see [`../server/README.md`](../server/README.md)), then:

```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_BASE_URL=http://localhost:3010
npm install
npm run dev                  # http://localhost:3000
npm run build && npm run typecheck
```

## How it works

- `src/store/indexApi.ts` — RTK Query slice: `getIndexes`/`getStats` queries; `runQuery`, `createIndex`,
  `dropIndex`, `seed`, `reset` mutations.
- `src/components/QueryConsole.tsx` — predicate builder + sort; renders the EXPLAIN badges, highlighting
  the **examined : returned** ratio (green when close to 1:1) and whether a sort stage ran / the query was
  covered.
- `src/components/IndexManager.tsx` — create indexes by picking fields (compound order matters), choose
  hash vs b-tree and unique, drop them, and resize the dataset.

Try: run `city = London` (COLLSCAN), create a b-tree on `city`, run it again (IXSCAN, far fewer rows).
