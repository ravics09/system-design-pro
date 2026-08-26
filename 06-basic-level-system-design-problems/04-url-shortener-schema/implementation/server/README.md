# URL Shortener — API (NestJS + Mongoose + Zod)

The write + redirect service. Generates collision-free Base62 codes, stores the
mapping with a unique index and TTL expiry, and resolves redirects cache-first.

## Layout

```
src/
├── main.ts                     # bootstrap (CORS + listen)
├── app.module.ts               # Mongo connection + UrlsModule
├── config.ts                   # zod-validated env
├── common/
│   ├── base62.ts               # encode/decode a counter → compact code
│   ├── cache.service.ts        # pluggable cache-aside (redis | memory) + negative cache
│   └── zod-validation.pipe.ts  # Zod validation pipe
├── counter/                    # atomic $inc counter → collision-free ids
└── urls/
    ├── url.schema.ts           # unique `code` index + TTL index on `expiresAt`
    ├── urls.service.ts         # create (+ alias 409), list, disable
    ├── redirect... (in ../redirect)
    ├── urls.controller.ts      # POST/GET/DELETE /api/urls
    └── urls.dto.ts             # Zod create schema + UrlView
└── redirect/
    ├── redirect.service.ts     # cache-aside resolve → 302 / 404 / 410
    └── redirect.controller.ts  # GET /:code, GET /health
```

## Endpoints

```http
POST   /api/urls            { longUrl, alias?, expiresAt?, ownerId? }  → 201 { code, shortUrl, ... }
GET    /api/urls?ownerId=   list an owner's links
DELETE /api/urls/:code?ownerId=   soft-disable a link
GET    /:code              302 redirect  (404 unknown · 410 expired/disabled)
GET    /health             { status: "ok" }
```

## How a code is generated

An atomic MongoDB counter (`$inc`, upsert) yields a monotonically increasing
integer — collision-free by construction — which is **Base62**-encoded into a
compact code (`62^7 ≈ 3.5T` codes in 7 chars). A `CODE_START_OFFSET` keeps early
codes a few characters long. Custom aliases bypass the counter and rely on the
**unique index** (duplicate → `409`). To hide volume/order, run the counter
through a reversible permutation before encoding (noted in `base62.ts`).

## Redirect path (cache-aside)

`GET /:code` → check cache → on miss read Mongo, backfill cache → `302`. Unknown
codes are negatively cached briefly to blunt penetration. Expiry is enforced both
by a **TTL index** and a read-time check (the sweeper is periodic) → `410`.
Click counting is fire-and-forget so it never slows the redirect.

## Run

```bash
npm install
cp .env.example .env       # set MONGODB_URI; CACHE_DRIVER=memory works without Redis
npm run build && npm start # :3002
```

## Notes

- Verified by an end-to-end test against in-memory MongoDB (create, 302, 404, 410, 409, uniqueness).
  `mongodb-memory-server` is a transient test tool, not a project dependency.
- Analytics are simplified to a click counter; production would emit to a queue (see the design doc).
