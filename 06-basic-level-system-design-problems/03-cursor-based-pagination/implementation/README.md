# Cursor Pagination — Full-Stack Reference Implementation

A runnable, full-stack demonstration of the design in
[`../03-cursor-based-pagination.md`](../03-cursor-based-pagination.md).

```
implementation/
├── server/   # NestJS + Mongoose + Zod  — the keyset (cursor) pagination API
└── web/      # Next.js + React + Redux Toolkit (RTK Query) — infinite-scroll client
```

## The idea in one picture

```
Next.js UI ──GET /items?limit&cursor──▶ NestJS API ──keyset query──▶ MongoDB
   ▲  RTK Query merge (append pages)         │  { data, pageInfo:{ nextCursor, hasNextPage } }
   └──────────────────────────────────────── ┘
```

- **Server** turns a `cursor` into an indexed range scan
  (`WHERE (createdAt,_id) < (v,id) ORDER BY createdAt DESC,_id DESC LIMIT n+1`) — O(page size) at any
  depth, stable under inserts. The cursor is an opaque base64url token of `{ sortValue, id }`.
- **Client** keeps the latest `nextCursor` and appends each page into a single RTK Query cache entry
  (`serializeQueryArgs` + `merge`), fetching the next page when a sentinel scrolls into view.

## Run it locally

You need Node ≥ 20 and a MongoDB instance.

```bash
# 1) API
cd server
npm install
cp .env.example .env          # set MONGODB_URI if needed
npm run build && npm start    # http://localhost:3001
curl -X POST localhost:3001/items/seed -H 'content-type: application/json' -d '{"count":100}'

# 2) Web (in another terminal)
cd web
npm install
cp .env.example .env.local     # NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
npm run dev                    # http://localhost:3000
```

Open the web app and scroll — pages load via cursor and append seamlessly.

## Verification

- **Server**: `npm run typecheck`, `npm run build`, and an end-to-end test (in-memory MongoDB) that
  proves page sizing, `hasNextPage`/`nextCursor`, **no duplicate ids across pages**, full traversal,
  cursor stability, and `400`s for invalid cursor / over-max limit.
- **Web**: `npm run typecheck` and `npm run build` (Next.js) both pass.

See each subfolder's README for details.
