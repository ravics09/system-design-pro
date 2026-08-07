# Write-Behind

> **In one line:** Writes go to the cache immediately and are flushed to the database asynchronously.

## Overview

Write-behind is a caching pattern where writes go to the cache immediately and are flushed to the database asynchronously. Writes feel fast because they complete as soon as the cache acknowledges them.

## Key Idea

The risk is **data loss**. If the cache fails before it flushes to the database, the writes are lost.

## Trade-offs & Considerations

- Very low write latency.
- Appropriate for high-write-volume workloads where some data loss is acceptable, like analytics event ingestion.

---

_Notes: (add your own content here)_
