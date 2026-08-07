# Write-Through

> **In one line:** Every write goes to the cache and the database simultaneously.

## Overview

Write-through is a caching pattern where every write goes to the cache and the database simultaneously. The cache is always consistent with the database because every update hits both.

## Key Idea

The trade-off is **write latency**. Every write must complete in both the cache and the database before returning to the caller.

## Trade-offs & Considerations

- Cache stays consistent with the database.
- Makes sense when read-after-write consistency is critical and the write latency cost is acceptable.

---

_Notes: (add your own content here)_
