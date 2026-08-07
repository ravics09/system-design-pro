# Sharding

> **In one line:** Splits data across multiple databases so each holds only a portion.

## Overview

Sharding splits data across multiple databases so each one holds only a portion. A **shard key** determines which database stores each piece of data. Sharding scales both write throughput and storage capacity because the load is divided across many machines.

## Key Idea

The hardest part of sharding is choosing the shard key:

- A **good** shard key distributes data and traffic evenly.
- A **poor** one creates hot partitions where one shard receives most of the traffic while others sit idle.

## Trade-offs & Considerations

- Scales writes and storage.
- **Cross-shard queries are expensive** — they must run on multiple shards and the results assembled.

---

_Notes: (add your own content here)_
