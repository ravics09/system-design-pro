# Bloom Filter

> **In one line:** A space-efficient probabilistic structure for set membership queries.

## Overview

A bloom filter is a space-efficient probabilistic data structure that answers membership queries: is this item in the set? It can say definitively that an item is **not** in the set, but it can only say that an item **might** be in the set, with a tunable false positive rate.

## Key Idea

Bloom filters are used when the cost of a false negative (missing a real member) is high but a small rate of false positives is acceptable, and when memory is too limited to store the full set.

## Trade-offs & Considerations

- Databases use them to avoid expensive disk lookups for keys that definitely do not exist.
- Web crawlers use them to track which URLs have been visited.

---

_Notes: (add your own content here)_
