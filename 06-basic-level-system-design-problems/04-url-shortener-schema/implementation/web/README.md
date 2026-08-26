# URL Shortener — Web (Next.js + React + Redux Toolkit)

A small client that shortens URLs and lists/manages the current owner's links,
using **RTK Query** for data fetching, caching, and cache invalidation.

## Layout

```
src/
├── app/
│   ├── layout.tsx        # wraps the app in the Redux <Providers>
│   └── page.tsx          # ShortenForm + LinksList
├── components/
│   ├── ShortenForm.tsx   # useShortenMutation → create a short URL
│   └── LinksList.tsx     # useGetLinksQuery + useDisableLinkMutation
├── store/
│   ├── urlsApi.ts        # RTK Query slice (shorten / getLinks / disableLink)  ← the core
│   ├── store.ts          # configureStore
│   └── Providers.tsx     # client-side Redux Provider
└── types.ts              # shared API types
```

## RTK Query pattern (`store/urlsApi.ts`)

```
shorten     (mutation) → invalidatesTags: ['Links']   // list auto-refreshes after create
getLinks    (query)    → providesTags:   ['Links']
disableLink (mutation) → invalidatesTags: ['Links']
```

Tag-based invalidation means the "My Links" list re-fetches automatically after a
create or disable — no manual cache updates.

## Run

```bash
npm install
cp .env.example .env.local     # NEXT_PUBLIC_API_BASE_URL=http://localhost:3002
npm run dev                    # http://localhost:3000
```

The API (in `../server`) must be running.

## Verify

```bash
npm run typecheck      # tsc --noEmit
npm run build          # next build (also type-checks)
```
