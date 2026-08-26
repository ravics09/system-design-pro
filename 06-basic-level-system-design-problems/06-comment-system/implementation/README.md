# Comment System — Full-Stack Reference Implementation

A runnable, full-stack implementation of the design in
[`../06-comment-system.md`](../06-comment-system.md).

```
implementation/
├── server/   # NestJS + Mongoose + Zod  — threaded comments via the materialized-path pattern
└── web/      # Next.js + React + Redux Toolkit (RTK Query) — recursive threaded UI
```

## What it demonstrates

- **Materialized path** tree modeling: each comment stores the dot-joined chain of ancestor ids
  (`a.b.c`) + `depth`, so a whole subtree is one **anchored-prefix indexed query**.
- **One-query thread read + O(n) in-memory assembly** into a nested tree (no recursive DB calls).
- **Tombstone soft-delete**: deleting a comment with replies keeps the node so children survive.
- **Denormalized** `score` / `replyCount`; **votes**, `new`/`top` **sorting**, and **root cursor pagination**.
- **Recursive rendering** on the client, with tag-based RTK Query cache invalidation.

## Run locally

Node ≥ 20 and a MongoDB instance required.

```bash
# 1) API
cd server
npm install
cp .env.example .env
npm run build && npm start     # http://localhost:3003

# 2) Web (another terminal)
cd web
npm install
cp .env.example .env.local     # NEXT_PUBLIC_API_BASE_URL=http://localhost:3003
npm run dev                    # http://localhost:3000
```

Post a comment, reply to it, vote, and toggle new/top — the thread re-renders from the API.

## Verification

- **Server**: `npm run typecheck`, `nest build`, and a **23-case end-to-end test** (in-memory MongoDB):
  nested create with correct `path`/`depth`, one-query nested assembly, denormalized `replyCount`,
  subtree fetch, vote + `sort=top`, ownership `404`, **tombstone keeps children**, root pagination
  (no overlap), and invalid-id `400`.
- **Web**: `next build` (compiles + type-checks + prerenders) and `tsc --noEmit` both pass.

See each subfolder's README for details.
