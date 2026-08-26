# Comment System — Web (Next.js + React + Redux Toolkit)

A threaded comment UI that renders the nested tree returned by the API and lets
users post, reply, and vote — using **RTK Query** for data + cache invalidation.

## Layout

```
src/
├── app/
│   ├── layout.tsx        # wraps the app in the Redux <Providers>
│   └── page.tsx          # renders <Thread/>
├── components/
│   ├── Thread.tsx        # new/top sort toggle + composer + root list
│   ├── CommentNode.tsx   # RECURSIVE render (indent by depth, vote, reply)  ← the core
│   └── CommentForm.tsx   # post a top-level comment or a reply
├── store/
│   ├── commentsApi.ts    # RTK Query: getThread / addComment / vote
│   ├── store.ts
│   └── Providers.tsx
└── types.ts
```

## Recursive rendering

The API returns a nested tree (assembled server-side from the materialized path).
`CommentNode` renders one comment then maps over `node.children`, recursing —
indentation is driven by `node.depth`. Deleted comments show a `[deleted]`
tombstone but still render their replies.

## RTK Query cache

```
getThread   (query)    → providesTags: ['Thread']
addComment  (mutation) → invalidatesTags: ['Thread']   // thread refetches after posting
vote        (mutation) → invalidatesTags: ['Thread']
```

The thread is cheap to refetch (one query + assembly), so tag invalidation keeps
the UI consistent without manual cache edits.

## Run

```bash
npm install
cp .env.example .env.local     # NEXT_PUBLIC_API_BASE_URL=http://localhost:3003
npm run dev                    # http://localhost:3000
```

The API (in `../server`) must be running.

## Verify

```bash
npm run typecheck      # tsc --noEmit
npm run build          # next build (also type-checks)
```
