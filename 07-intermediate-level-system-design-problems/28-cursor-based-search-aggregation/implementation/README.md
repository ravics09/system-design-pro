# Cursor-Based Search Aggregation — implementation

Fast token search with cursor pagination, implementing the
[design doc](../28-cursor-based-search-aggregation.md): `$all` token matching over a **multikey index**
with **keyset (cursor) pagination** that stays O(page size) at any depth and doesn't drift.

## Stack

- **Node.js + TypeScript + Express**
- **MongoDB** aggregation, `{tokens:1, _id:-1}` multikey index

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/docs` `{title}` | Create a doc (auto-tokenized) |
| GET | `/api/search?q=&limit=&cursor=` | Token search, keyset-paginated |

## Design-doc mapping

- **Indexable token match** → `$match { tokens: { $all } }` over the multikey index (no scan).
- **Keyset pagination** → `_id < cursor` sorted `_id` desc → an index seek, O(page size) at any depth;
  no `skip/OFFSET`, no drift when docs are inserted between pages.
- **`limit + 1` sentinel** → detect "has next page" without a separate count.
- **Opaque cursor** → base64url of the last `_id`, validated on decode (rejects tampering/garbage).

## Run it

```bash
docker compose up --build          # http://localhost:3128
curl -XPOST localhost:3128/api/docs -H 'content-type: application/json' -d '{"title":"Node.js Redis guide"}'
curl 'localhost:3128/api/search?q=node&limit=10'
```

```bash
npm install && npm test            # 4 unit tests (tokenize, cursor round-trip/validation, match builder)
npm run typecheck
```

## Verification

- `npm test` covers tokenization, cursor encode/decode + validation, and `$all`+keyset match building.
  `npm run typecheck` passes. Aggregation + pagination run against Mongo under `docker compose up`.
