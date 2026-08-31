# 11. Design a Tagging System

> **In one line:** Model a many-to-many relationship between items and tags so that both "tags on this
> post" and — the hard direction — "all posts with tag X" (and "posts with tags X **and** Y") are fast at
> scale.

> **Original prompt:** Schema design for adding tags to posts and efficiently querying "Posts with Tag X".

## Overview

Tagging is a deceptively simple **many-to-many** modeling problem whose difficulty is entirely in the
*query pattern*. Adding tags to a post is trivial; the expensive question is the reverse lookup — "give me
recent posts tagged `nodejs`" — and the intersection — "posts tagged `nodejs` **and** `mongodb`". Get the
schema and indexes right and these are index scans; get them wrong and they're full-collection scans.

## Functional Requirements

- Attach multiple tags to an item (post/product/photo); a tag applies to many items.
- Query items by a single tag, sorted (usually newest first), paginated.
- Query items matching **multiple** tags (AND / OR).
- Tag autocomplete and per-tag counts ("#nodejs — 12k posts").
- Normalize tags (case, whitespace, synonyms) so `NodeJS` and `nodejs` are one tag.

## Non-Functional Requirements

| Property | Target |
|---|---|
| "Posts with tag X" | Index-backed, O(log n + k), paginated — never a full scan |
| Multi-tag AND | Efficient intersection, not N separate scans merged in app |
| Write cost | Tagging an item is cheap; popular tags don't create hotspots |
| Scale | Millions of items, thousands of tags, skewed tag popularity |

## Modeling Options

**Option A — Join table (relational, normalized):**

```mermaid
erDiagram
  POST ||--o{ POST_TAG : has
  TAG  ||--o{ POST_TAG : labels
  POST { bigint id PK, text body, timestamp created_at }
  TAG  { int id PK, string name UK, int usage_count }
  POST_TAG { bigint post_id FK, int tag_id FK, timestamp created_at }
```

- `post_tag(post_id, tag_id)` with indexes **both ways**: `(tag_id, created_at)` for "posts with tag X
  newest-first", and `(post_id)` for "tags of a post".
- Multi-tag AND = join/intersect: `WHERE tag_id IN (x,y) GROUP BY post_id HAVING COUNT(DISTINCT tag_id)=2`.
- Normalized, no duplication, easy tag rename; the standard default.

**Option B — Embedded tag array (document DB, e.g. Mongo):**

```js
// posts: { _id, body, createdAt, tags: ["nodejs", "mongodb"] }
db.posts.createIndex({ tags: 1, createdAt: -1 })   // multikey index
db.posts.find({ tags: "nodejs" }).sort({ createdAt: -1 })
db.posts.find({ tags: { $all: ["nodejs", "mongodb"] } })   // AND
```

- A **multikey index** on `tags` makes single-tag and `$all` queries index-backed.
- Denormalized: fast reads, but renaming a tag means touching every document (usually rare/acceptable).

| | Join table | Embedded array |
|---|---|---|
| Multi-tag AND | SQL intersection | `$all` on multikey index |
| Tag rename | One row | Rewrite many docs |
| Read locality | Extra join | Single doc read |
| Best for | Relational stores, frequent tag edits | Document stores, read-heavy |

## The Hard Query: "Posts with Tag X" (efficiently)

```mermaid
flowchart LR
  Q["find posts tagged 'nodejs'<br/>newest first, page 2"] --> IDX["Index on (tag, createdAt)"]
  IDX --> KS["Keyset pagination:<br/>createdAt < lastSeen"]
  KS --> R["k rows, no OFFSET scan"]
```

- The compound index `(tag, createdAt desc)` means the DB walks straight to the tag's slice already sorted
  — top-k is a range read.
- Paginate with **keyset/cursor** (`createdAt < lastCursor`), never `OFFSET` (deep offsets re-scan).

## Multi-Tag Intersection at Scale

For AND queries, intersecting **posting lists** (like a search engine's inverted index) is the mental
model. For very hot combinations, precompute or use a proper search index:

- **Redis sets per tag:** `SADD tag:nodejs {postId}` → `SINTER tag:nodejs tag:mongodb` returns the
  intersection in the engine, not the app. Great for hot AND queries; memory cost for huge tags.
- **Search engine (Elasticsearch):** tags as keyword fields; boolean tag filters + full-text + facets in
  one query. This is what powers real tag/faceted search at scale.

## Tag Counts & Popularity (skew)

Tag popularity is **power-law**: a few tags have millions of items, most have a handful.

- Maintain `usage_count` per tag with an async counter (like problem 06's write-behind) rather than
  `COUNT(*)` on every render.
- Very hot tags = hot partitions; cache their first page aggressively and treat counts as approximate.

## Normalization & Synonyms

- Canonicalize on write: lowercase, trim, collapse spaces/`-`, strip emojis → store a `slug`, display a
  pretty name.
- Synonyms/aliases: map `js`, `javascript` → one canonical tag id so queries and counts unify.
- A tag whitelist or moderation prevents tag spam / near-duplicate proliferation.

## Scaling & Failure Scenarios

| Scenario | Response |
|---|---|
| Extremely popular tag | Cache first pages; keyset pagination; consider a dedicated hot-tag path |
| Many-tag AND on huge tags | Redis `SINTER` or Elasticsearch bool filter instead of app-side merge |
| Tag rename (embedded model) | Background rewrite job; or keep a tag-id indirection so rename is one row |
| Count accuracy | Async counters + periodic reconciliation |
| Sharding | Shard posts by id; keep the tag→posts index in a searchable store or Redis sets |

## Security

- Sanitize tag input (stored XSS via tag names rendered in HTML); enforce length/charset.
- Authorize tag edits (who can add/remove tags on someone's post).
- Rate-limit tag creation to curb spam/SEO abuse.

## Performance

- Compound `(tag, createdAt)` index + keyset pagination = predictable, fast reads.
- Cache hot tag pages and tag counts; they change slowly relative to reads.
- Avoid `$all`/`IN` over many huge tags on the primary DB — push to Redis/ES.

## Trade-offs & Pitfalls

- **No reverse index** (`(tag, createdAt)`) → "posts with tag X" becomes a full scan.
- **`OFFSET` pagination** on tag feeds → deep pages re-scan; use cursors.
- **`COUNT(*)` for tag counts on every request** → expensive; maintain counters.
- **App-side multi-tag intersection** → pulls huge lists into memory; intersect in the engine.
- **Un-normalized tags** → `NodeJS`/`nodejs`/`node.js` fragment counts and search.

## Interview Questions & Answers

- **How do you model tags?** Many-to-many: a join table `(post_id, tag_id)` or an embedded multikey `tags`
  array — choose per store and edit frequency.
- **How is "posts with tag X" fast?** A compound index `(tag, createdAt)` + keyset pagination → a sorted
  range read.
- **How do you do multi-tag AND?** SQL intersection / Mongo `$all`, or Redis `SINTER` / Elasticsearch for
  hot, large intersections.
- **How do you handle popular-tag skew?** Cache hot tag pages, approximate counts via async counters, hot
  paths for the biggest tags.
- **How do you keep tag counts cheap?** Maintain `usage_count` with write-behind increments + periodic
  reconciliation, not `COUNT(*)` per read.
- **Renaming a tag with embedded arrays?** Background rewrite, or add a tag-id indirection so rename is a
  single row.
