# Comment System — API (NestJS + Mongoose + Zod)

A threaded (Reddit-style) comment API built on the **materialized-path** pattern.

## Layout

```
src/
├── main.ts                     # bootstrap (CORS + listen)
├── app.module.ts               # Mongo connection + CommentsModule
├── config.ts                   # zod-validated env
├── common/
│   ├── tree.ts                 # assembleForest: O(n) flat list → nested trees
│   └── zod-validation.pipe.ts
└── comments/
    ├── comment.schema.ts       # materialized path + depth + indexes
    ├── comments.service.ts     # path/depth derivation, thread build, subtree, tombstone, votes
    ├── comments.controller.ts  # REST endpoints
    └── comments.dto.ts         # Zod schemas + view types
```

## Endpoints

```http
POST   /posts/:postId/comments        { parentId?, authorId, body }  → 201 comment
GET    /posts/:postId/comments?sort&limit&cursor   → { roots: Tree[], pageInfo }
GET    /comments/:id/subtree          lazy-load one comment's subtree
PATCH  /comments/:id                  { authorId, body }  (owner-only → 404 otherwise)
DELETE /comments/:id                  { authorId }        (tombstone soft-delete)
POST   /comments/:id/vote             { dir: 1 | -1 }     → { score }
GET    /health
```

## How the materialized path works

Each comment stores `path` = ancestor ids + its own id, dot-joined (e.g. `665a.665b.665c`), plus
`depth` and `parentId`.

- **Create a reply**: `path = parent.path + "." + newId`, `depth = parent.depth + 1`. The id is
  generated up-front so the path is set in a single insert; the parent's `replyCount` is `$inc`-ed.
- **Read a thread**: paginate top-level comments (keyset cursor), fetch all descendants of that page in
  ONE query via an anchored prefix regex `^(rootId1|rootId2|…)\.`, then assemble the nested trees in
  memory (O(n) hash-map join on `parentId`).
- **Subtree**: `{ postId, path: /^<comment.path>\./ }` — a single indexed lookup.

## Delete = tombstone

Deleting a comment sets `deleted: true` and blanks the body to `[deleted]` but **keeps the node**, so
its replies remain attached. A background job can prune fully-dead branches later.

## Run

```bash
npm install
cp .env.example .env      # set MONGODB_URI
npm run build && npm start
```

## Notes

- Votes use a simple denormalized `$inc score`; production should track one vote per user in a `votes`
  collection to prevent ballot stuffing (noted in the code).
- `authorId` is taken from the request for demo purposes; in production it comes from the auth token.
- Verified by an end-to-end test against in-memory MongoDB. `mongodb-memory-server` is a transient test
  tool, not a project dependency.
