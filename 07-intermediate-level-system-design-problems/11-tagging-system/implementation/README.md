# Tagging System — implementation

A many-to-many tagging service implementing the [design doc](../11-tagging-system.md): normalized tags,
a **multikey index** for fast "posts with tag X", multi-tag **AND** (`$all`), and **keyset pagination**.

## Stack

- **Node.js + TypeScript + Express**
- **MongoDB** — posts with an embedded `tags` array + a `{tags:1, _id:-1}` multikey index

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Liveness |
| POST | `/api/posts` `{title, body, tags}` | Create a post (tags normalized) |
| GET | `/api/tags/:tag/posts?limit=&cursor=` | Posts with a tag, newest-first, keyset-paginated |
| GET | `/api/posts?tags=a,b&mode=all\|any&cursor=` | Multi-tag AND/OR query |

## Design-doc mapping

- **Reverse lookup "posts with tag X"** → multikey index `{tags:1, _id:-1}` → an index range, not a scan.
- **Multi-tag AND / OR** → `$all` / `$in` (`buildTagQuery`).
- **Keyset pagination** → `_id < cursor` sorted `_id` desc (no slow `skip`/`OFFSET`).
- **Normalization** → `normalizeTag` collapses case/separators/symbols so tags don't fragment.

## Run it

```bash
docker compose up --build          # http://localhost:3111
```

```bash
npm install && npm test            # 5 unit tests (normalization + query builder)
npm run typecheck
```

## Verification

- `npm test` covers tag normalization/dedupe and `$all`/`$in`/cursor query building. `npm run typecheck`
  passes. Index-backed queries run under `docker compose up`.
