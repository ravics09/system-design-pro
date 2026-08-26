# 6. Design a Comment System

> **In one line:** Model a Reddit/YouTube-style nested comment thread in MongoDB using the
> **Materialized Path** pattern — so an entire subtree loads in one indexed query — and design the read
> path, moderation, security, and scaling that a real comment system needs.

> **Original prompt:** Model a schema for a nested comment thread (Reddit style) using the Materialized Path pattern.

## Overview

Nested comments form a tree: a comment replies to a comment, which replies to another, arbitrarily deep.
Storing one comment is trivial; the hard parts are **reading a whole thread efficiently**, **rendering
it in correct nested order**, and doing so under heavy read traffic with moderation and abuse controls.

The naive approach — store `parentId` and recurse with a query per level — causes N+1 queries and
unbounded round trips. The **Materialized Path** pattern stores, on each comment, the path from the root
to its parent, turning "fetch this whole subtree" into a single indexed prefix query.

## Real-World Context

- **Reddit and Hacker News** render deeply nested discussion trees where a popular post can have tens of
  thousands of comments — read performance and lazy-loading deep replies are everything.
- **YouTube and Instagram** deliberately cap nesting to two levels (comment → replies) to keep the UI and
  the data model simple; this is a legitimate product decision that changes the schema.
- **Read/write ratio is extreme** — a comment is written once and read by thousands. As with most feeds,
  the design optimizes the read path and denormalizes counts/scores to avoid computing them per request.

The interview signal is recognizing the tree-modeling trade-off and choosing a pattern that matches the
access pattern (fetch-as-subtree, write-often, arbitrary depth).

## Requirements

**Functional**

- Post a comment on a post, or a reply to any comment (arbitrary depth, unless capped).
- Fetch a post's comment thread (or a subtree) in correct nested order.
- Edit, delete (with replies preserved), and vote/score comments.
- Paginate large threads.

**Non-functional**

- **Performance:** load a thread (or subtree) without N+1 queries; O(1) query count per subtree.
- **Scalability:** support posts with tens of thousands of comments and high read QPS.
- **Integrity:** deleting a parent must not orphan its replies.
- **Security/abuse:** authorization on edit/delete, spam/abuse controls, XSS-safe rendering.

## Tree-Modeling Options

| Pattern | Idea | Read subtree | Insert | Weakness |
|---|---|---|---|---|
| **Parent Reference** | Each node stores `parentId` | Recursive / `$graphLookup` | Trivial | N+1 queries or expensive graph lookup |
| **Array of Ancestors** | Store an array of all ancestor ids | One query (`ancestors: id`) | Easy | Larger docs; array upkeep |
| **Materialized Path** | Store the path string (`,A,B,`) | One **prefix** query | Easy | Path rewrite if a node moves |
| **Nested Sets** | Store left/right bounds | One range query | **Expensive** — rebalances on every insert | Terrible for write-heavy trees |

For a comment thread (write-often, read-as-subtree, arbitrary depth), **Materialized Path** hits the
sweet spot: cheap inserts *and* a single query to read any subtree.

## The Materialized Path Idea

Each comment stores the **path of ancestor ids** leading to it. A reply's path is
`parent.path + parent._id`. To fetch a subtree, query for every comment whose path **starts with** the
ancestor's path.

```mermaid
flowchart TD
    R["Comment A  (path ',')"] --> B["Comment B  (path ',A,')"]
    R --> C["Comment C  (path ',A,')"]
    B --> D["Comment D  (path ',A,B,')"]
    D --> E["Comment E  (path ',A,B,D,')"]
```

To load the subtree under **B**, one query: `path` starts with `,A,B,`. Depth is derivable from the path
(count separators), so the client can indent correctly. Sorting by `path` yields a natural depth-first
ordering.

## Schema (Mongoose)

```typescript
import { Schema, model, Types } from "mongoose";

const commentSchema = new Schema(
  {
    postId:   { type: Types.ObjectId, ref: "Post", required: true, index: true },
    userId:   { type: Types.ObjectId, ref: "User", required: true },
    parentId: { type: Types.ObjectId, ref: "Comment", default: null },

    // Comma-delimited materialized path of ancestor ids; root comments = ",".
    path:  { type: String, required: true, default: "," },
    depth: { type: Number, required: true, default: 0 },

    content: { type: String, required: true, maxlength: 10_000 },
    score:   { type: Number, default: 0 },          // upvotes - downvotes (denormalized)
    replyCount: { type: Number, default: 0 },       // denormalized for "view N replies"

    isDeleted: { type: Boolean, default: false },   // tombstone — keeps children renderable
    deletedAt: { type: Date, default: null },
    editedAt:  { type: Date, default: null },
  },
  { timestamps: true },
);

commentSchema.index({ postId: 1, path: 1 });                 // subtree / whole-thread reads
commentSchema.index({ postId: 1, path: 1, score: -1 });      // "best" sort within a level
commentSchema.index({ postId: 1, createdAt: -1 });           // top-level "new" feed

export const Comment = model("Comment", commentSchema);
```

Interview points:

- **Comma delimiters (`,A,B,`)** stop a prefix query from accidentally matching an id that merely shares
  leading characters.
- **Denormalized `score` and `replyCount`** avoid recomputing aggregates on every read — updated on
  write. See [Index](../02-data-and-storage-concepts/05-index.md).

## Creating a Reply

```typescript
async function addReply(postId, userId, parentId, content) {
  let path = ",", depth = 0;
  if (parentId) {
    const parent = await Comment.findById(parentId).lean();
    if (!parent) throw new Error("Parent not found");
    path  = `${parent.path}${parent._id},`;   // parent's path + parent id
    depth = parent.depth + 1;
    await Comment.updateOne({ _id: parentId }, { $inc: { replyCount: 1 } });
  }
  return Comment.create({ postId, userId, parentId, path, depth, content });
}
```

The path is computed once at insert time from the parent — no recursion, one extra read.

## Reading a Thread

One indexed query returns the entire subtree (or the whole post's comments), already filterable and
sortable:

```typescript
// Whole thread for a post, ordered depth-first.
const thread = await Comment.find({ postId })
  .sort({ path: 1, score: -1 })
  .lean();

// Just the subtree under a given comment (anchored prefix — uses the index):
const prefix = escapeRegex(parent.path + parent._id + ",");
const subtree = await Comment.find({ postId, path: { $regex: `^${prefix}` } });
```

Then assemble the nested structure **in application memory** from the flat list (group by `parentId`, or
order by `path` and indent by `depth`).

> **Anchor the regex with `^`** so it's a prefix match the index can serve; an unanchored regex forces a
> full collection scan.

## Pagination in Large Threads

A viral post can have tens of thousands of comments, so you can't load them all:

- **Top-level + lazy replies (Reddit/YouTube model):** cursor-paginate root comments (by `score` or
  `createdAt`), then load each comment's replies on demand ("view 24 more replies"). This bounds the
  initial payload regardless of thread size.
- **Flat cursor pagination:** cursor-paginate the path-ordered flat list. See
  [Cursor-Based Pagination](./03-cursor-based-pagination.md).

## Moderation & Deletes

Deleting a comment that has replies must not orphan the subtree. Use a **tombstone**: set
`isDeleted: true`, blank the content to "[deleted]", but keep the node so children still render — the
standard forum behavior. Moderation adds: soft-hide/remove by moderators, report queues, shadow-banning,
and an audit trail of who removed what and when.

## Performance

- **One query per subtree** is the whole point — the `{ postId, path }` index turns nested reads into a
  single index scan instead of N+1 traversals.
- **Cache hot threads:** for popular posts, cache the assembled/rendered thread and invalidate on new
  replies (see [Caching Layer](./10-caching-layer.md)); this is often the biggest win because a handful of
  viral posts drive most reads.
- **Denormalize aggregates:** maintain `score` and `replyCount` on write so the read path never runs
  count/sum aggregations.
- **`.lean()` reads** skip Mongoose hydration on large flat result sets.

## Scalability

- **Read scaling:** serve threads from replicas/cache; comment reads dwarf writes.
- **Sharding:** shard by `postId` so an entire post's comment tree (all sharing the `postId`) lives on
  one shard and subtree queries stay local (see [Sharding](../02-data-and-storage-concepts/06-sharding.md)).
- **Hot posts:** a viral thread is a hotspot; cache aggressively and lazy-load deep branches. Consider
  capping displayed depth and offering "continue this thread" links (Reddit's approach).
- **Vote storms:** high-frequency voting on a popular comment can contend on its `score` `$inc` — batch
  vote aggregation or move counters to a store better suited to hot counters.

## Security

- **XSS is the top risk:** comment content is user-generated and rendered to other users. Never trust it —
  sanitize/encode on output (escape HTML, strip scripts), and apply a Content-Security-Policy. Store the
  raw text but render it safely.
- **Authorization:** only the author can edit/delete their comment; only moderators can remove others'.
  Enforce with ownership checks (`userId` from the auth token), not client-supplied ids — see
  [User Authentication System](./01-user-authentication-system.md).
- **Spam & abuse:** rate-limit comment creation per user/IP (see [Rate Limiter](./05-rate-limiter-middleware.md)),
  run spam/toxicity filters, and support reporting and shadow-banning.
- **Vote manipulation:** dedupe votes per user per comment (a unique `(userId, commentId)` vote record)
  so a user can't inflate a score by voting repeatedly.
- **Input limits:** cap content length and reply depth to prevent abuse and runaway documents.

## Reliability & Edge Cases

- **Deleting a parent** → tombstone, never hard-delete, or replies become unreachable.
- **`replyCount` drift:** if a create/delete fails midway, the denormalized counter can drift; reconcile
  periodically or update it transactionally with the insert.
- **Moving a subtree** (rare for comments) requires rewriting the path of all descendants — a known cost
  of Materialized Path; usually not needed for comments.
- **Very deep threads** produce long path strings and huge in-memory trees — cap depth and lazy-load.

## Tips

- Store the **path of ancestors** (comma-delimited) plus a **`depth`** on each comment.
- Compute the path **once at insert** from the parent — no recursion.
- Read any subtree with a single **anchored prefix** query on `path` (index-backed).
- **Assemble the tree in memory**; order by `path` for depth-first rendering.
- **Tombstone** deleted comments with children; denormalize `score`/`replyCount`.
- **Sanitize on output** to prevent XSS, and **dedupe votes** to prevent manipulation.

## Trade-offs & Pitfalls

- **Materialized Path vs Parent Reference:** path enables one-query subtree reads but requires
  maintaining the path string; parent-reference is simpler to write but causes N+1 / graph lookups on read.
- **Unanchored regex on `path`** can't use the index → full scan; always anchor with `^`.
- **Nested Sets** read beautifully but rebalance on every insert — wrong for the write frequency of comments.
- **Hard-deleting a parent** orphans replies — use tombstones.
- **Trusting raw content on render** is an XSS hole — always encode/sanitize on output.
- **Denormalized counters can drift** — reconcile or update them atomically with the write.

## System Design Cheat Sheet

```text
1. SHAPE       Arbitrary-depth tree, read-as-subtree, write-often
2. PATTERN     Materialized Path (path + depth per node)
3. WRITE       reply.path = parent.path + parent._id (+ bump replyCount)
4. READ        One anchored prefix query on path (indexed)
5. RENDER      Assemble tree in memory; order by path, indent by depth
6. PAGINATE    Top-level cursor + lazy-load deep replies
7. MODERATE    Tombstone deletes; report queue; audit trail
8. SECURITY    Sanitize on output (XSS); authz on edit/delete; dedupe votes; rate-limit
9. SCALE       Shard by postId; cache hot threads; denormalize score/replyCount
```

## Interview Questions & Answers

### A. Modeling

- **How would you model a nested comment tree, and why that pattern?**
  I'd use the Materialized Path pattern: each comment stores a comma-delimited path of its ancestor ids
  plus its depth. I choose it because comment systems are write-often (every reply is an insert) and
  read-as-subtree (you fetch a whole thread or branch at once), and Materialized Path gives cheap inserts
  *and* single-query subtree reads. The path also lets me sort depth-first and compute indentation without
  extra work.

- **Why not just store `parentId` and traverse?**
  A pure parent-reference is trivial to write but painful to read: to load a thread you either issue one
  query per level (classic N+1, unbounded round trips) or use `$graphLookup`, which is expensive and hard
  to paginate. For a read-heavy system where a single thread can have thousands of nodes, that read cost is
  the bottleneck, so I trade a little write-time bookkeeping (maintaining the path) for a dramatically
  cheaper read.

- **What other tree patterns exist and when would you use them?**
  Array-of-ancestors is similar to Materialized Path and also gives one-query reads, at the cost of a
  larger array field. Nested Sets store left/right bounds and read via a range query, which is elegant for
  read-only hierarchies but requires rebalancing bounds on every insert — disqualifying for something as
  write-frequent as comments. If the product caps nesting at two levels (YouTube-style), I might not need a
  tree pattern at all — just `parentId` with a single level of replies.

### B. Reads & Writes

- **How do you fetch an entire thread efficiently?**
  One indexed query: match `postId` and prefix-match `path` with an anchored regex (`^,A,B,`), backed by a
  `{ postId, path }` compound index. That returns the whole subtree as a flat list in a single round trip,
  and I assemble the nested structure in application memory by ordering on `path` and indenting by `depth`.
  No recursion, no N+1.

- **Why must the regex be anchored, and why comma-delimit the path?**
  Anchoring with `^` makes it a prefix match, which MongoDB can serve from the index; an unanchored regex
  is a substring search that forces a full collection scan. The comma delimiters prevent false prefix
  matches — without them, the path for id `A1` would also match a query anchored on id `A`, pulling in
  unrelated branches. Wrapping every id in commas makes the boundaries unambiguous.

- **How do you keep reply counts and scores fast?**
  I denormalize them: `replyCount` is incremented on the parent when a reply is created, and `score` is
  maintained as votes come in, so the read path never runs count or sum aggregations over the subtree.
  The trade-off is that these counters can drift if a write partially fails, so I either update them
  atomically with the insert or run a periodic reconciliation job.

### C. Pagination, Moderation, Reliability

- **A post goes viral with 50,000 comments — how do you not load them all?**
  I paginate top-level comments with a cursor (sorted by score or recency) and lazy-load replies on
  demand — the "view N more replies" pattern Reddit and YouTube use. That bounds the initial payload to a
  page of root comments regardless of total thread size, and deep branches are only fetched if the user
  actually expands them. I'd also cap displayed depth and offer "continue this thread" links for extremely
  deep chains.

- **How do you delete a comment that has replies?**
  I tombstone it — set `isDeleted`, replace the content with "[deleted]", but keep the node in place so its
  children still render in the tree. Hard-deleting would orphan the entire subtree beneath it. Moderator
  removals work the same way but are attributed and recorded in an audit trail, and I keep a report queue
  so users can flag content for review.

- **How do you keep the denormalized counters correct?**
  I prefer updating the counter in the same operation as the insert/delete where possible, and I run a
  periodic reconciliation that recomputes counts for recently active threads to correct any drift from
  partial failures. Absolute real-time accuracy on a reply count isn't critical, so eventual consistency
  with periodic correction is an acceptable trade-off for the read-path speed it buys.

### D. Security & Scale

- **What are the main security concerns in a comment system?**
  XSS is number one — comment text is user-generated and shown to other users, so I store the raw text but
  sanitize/encode it on output and apply a Content-Security-Policy, never rendering it as raw HTML.
  Authorization is next: only the author can edit/delete their own comment and only moderators can remove
  others', enforced with the `userId` from the auth token rather than any client-supplied field. I also
  rate-limit creation to fight spam, dedupe votes with a unique per-user-per-comment record to stop score
  manipulation, and cap content length and depth.

- **How would you shard and scale this?**
  I'd shard by `postId` so an entire post's comment tree lives on one shard — all comments share that
  `postId`, so subtree queries stay local to a single shard instead of scattering. Reads are served from
  replicas and, crucially, from a cache for hot threads, since a few viral posts drive most of the traffic;
  I invalidate that cache on new replies. For vote storms on a popular comment I'd batch vote aggregation to
  avoid contention on a single document's score counter.

---

_Notes: (add your own content here)_
