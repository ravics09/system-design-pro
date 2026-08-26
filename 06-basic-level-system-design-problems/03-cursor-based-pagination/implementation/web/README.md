# Cursor Pagination — Web (Next.js + React + Redux Toolkit)

An infinite-scroll client that consumes the cursor-paginated API. Demonstrates
the **RTK Query infinite-list pattern**: collapse every page of a query into one
cache entry and append as pages arrive.

## Layout

```
src/
├── app/
│   ├── layout.tsx        # wraps the app in the Redux <Providers>
│   └── page.tsx          # renders <Feed/>
├── components/
│   └── Feed.tsx          # IntersectionObserver → advance cursor → list grows
├── store/
│   ├── itemsApi.ts       # RTK Query slice — the infinite-merge logic  ← the core
│   ├── store.ts          # configureStore
│   └── Providers.tsx     # client-side Redux Provider
└── types.ts              # shared API types
```

## The infinite-merge pattern (`store/itemsApi.ts`)

```
serializeQueryArgs: `${endpointName}-${limit}`   // drop cursor → all pages share ONE cache entry
merge:              append incoming page (deduped by id) to the accumulated list
forceRefetch:       currentArg.cursor !== previousArg.cursor  // fetch when cursor advances
transformResponse:  { data, pageInfo } → { items, pageInfo }  // accumulated cache shape
```

`Feed.tsx` holds the current `cursor` in local state. An `IntersectionObserver`
sentinel advances `cursor` to `pageInfo.nextCursor` when it scrolls into view;
RTK Query fetches that page and `merge` appends it — the list grows with no manual
cache bookkeeping.

## Run

```bash
npm install
cp .env.example .env.local     # NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
npm run dev                    # http://localhost:3000
```

The API (in `../server`) must be running and seeded.

## Verify

```bash
npm run typecheck      # tsc --noEmit
npm run build          # next build (also type-checks)
```
