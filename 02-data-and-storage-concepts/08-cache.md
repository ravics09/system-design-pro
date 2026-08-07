# Cache

> **In one line:** A fast storage layer holding copies of frequently accessed data.

## Overview

A cache is a fast storage layer that holds copies of frequently accessed data to avoid repeated slow operations. The most common use is an in-memory cache in front of a database, serving read requests from memory and only going to the database on a miss.

## Key Idea

The trade-off is **staleness**. The cache holds a copy that can become outdated when the source data changes.

## Trade-offs & Considerations

- Designing the cache means deciding how stale data can be and for how long.
- This determines the expiry policy and invalidation strategy.

---

_Notes: (add your own content here)_
