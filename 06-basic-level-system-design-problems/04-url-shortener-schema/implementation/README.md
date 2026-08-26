# URL Shortener — Full-Stack Reference Implementation

A runnable, full-stack implementation of the design in
[`../04-url-shortener-schema.md`](../04-url-shortener-schema.md).

```
implementation/
├── server/   # NestJS + Mongoose + Zod  — write API + cache-aside redirect
└── web/      # Next.js + React + Redux Toolkit (RTK Query) — shorten form + links list
```

## What it demonstrates

- **Collision-free codes**: an atomic counter → **Base62** (no retry loop), with custom aliases
  guarded by a **unique index** (`409` on duplicate).
- **Schema + TTL**: `code` unique index and a **TTL index** on `expiresAt`; expired links resolve to
  **410**, unknown to **404**.
- **Read-optimized redirect**: **cache-aside** (pluggable Redis / in-memory) with negative caching;
  `GET /:code` → **302**; click counting is fire-and-forget.
- **Client**: RTK Query mutation/query with **tag-based invalidation** so the links list refreshes
  automatically after create/disable.

## Run locally

Node ≥ 20 and a MongoDB instance required.

```bash
# 1) API
cd server
npm install
cp .env.example .env
npm run build && npm start     # http://localhost:3002

# 2) Web (another terminal)
cd web
npm install
cp .env.example .env.local     # NEXT_PUBLIC_API_BASE_URL=http://localhost:3002
npm run dev                    # http://localhost:3000
```

Shorten a link in the UI, then click the short URL to be redirected (302) to the original.

## Verification

- **Server**: `npm run typecheck`, `nest build`, and a **16-case end-to-end test** (in-memory MongoDB):
  create + Base62 code, redirect **302**, unknown **404**, expired/disabled **410**, duplicate alias
  **409**, reserved/invalid input **400**, and **unique** generated codes.
- **Web**: `next build` (compiles + type-checks + prerenders) and `tsc --noEmit` both pass.

See each subfolder's README for details.
