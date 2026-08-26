# Cursor Pagination — API (NestJS + Mongoose + Zod)

The keyset (cursor) pagination API. Turns an opaque cursor into an indexed range
scan, so paging is O(page size) at any depth and stable under inserts.

## Layout

```
src/
├── main.ts                     # bootstrap (CORS + listen)
├── app.module.ts               # Mongo connection + ItemsModule
├── config.ts                   # zod-validated env
├── common/
│   ├── cursor.ts               # encode/decode + keyset filter builder  ← the core
│   └── zod-validation.pipe.ts  # Zod pipe for query validation
└── items/
    ├── item.schema.ts          # Mongoose model + compound index (createdAt,_id)
    ├── items.dto.ts            # Zod query schema + response types (limit clamped)
    ├── items.service.ts        # over-fetch limit+1 → hasNextPage + nextCursor
    ├── items.controller.ts     # GET /items, POST /items/seed
    └── items.module.ts
```

## Endpoints

```http
GET  /items?limit=20&cursor=<opaque>   # one page, newest first
POST /items/seed  { "count": 100 }     # dev helper: (re)seed the collection
```

Response:

```json
{
  "data": [ { "id": "...", "title": "Item 100", "body": "...", "createdAt": "2026-..." } ],
  "pageInfo": { "nextCursor": "eyJ2Ijoi...", "hasNextPage": true, "limit": 20 }
}
```

## How the cursor works

The cursor is `base64url({ v: <ISO createdAt>, id: <_id> })`. The next page is:

```
WHERE createdAt < v OR (createdAt = v AND _id < id)
ORDER BY createdAt DESC, _id DESC
LIMIT limit + 1            # the extra row tells us hasNextPage
```

The `_id` tie-breaker makes ordering total, so rows sharing a `createdAt` are never dropped or
duplicated at page edges. A malformed cursor is rejected with `400`; `limit` is clamped to a max.

## Run

```bash
npm install
cp .env.example .env
npm run build && npm start
```

## Notes

- **Forward** pagination is implemented; backward (`before`) paging follows the same tuple-comparison
  pattern with the sort reversed then re-reversed — noted as an extension.
- For a public API, additionally **sign** the cursor (HMAC) so it can't be forged.
- Verified by an end-to-end test against an in-memory MongoDB (see the design doc's Implementation
  section); `mongodb-memory-server` is a transient test-only tool, not a project dependency.
