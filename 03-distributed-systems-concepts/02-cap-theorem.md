# CAP Theorem

> **In one line:** A distributed system can guarantee at most two of consistency, availability, and partition tolerance.

## Overview

The CAP theorem states that a distributed system can guarantee at most two of three properties: consistency, availability, and partition tolerance.

## Key Idea

Since network partitions are unavoidable in any real distributed system, **partition tolerance is mandatory**, which means the real choice during a partition is between consistency and availability.

- A system that chooses **consistency** will reject requests rather than serve stale data during a partition.
- A system that chooses **availability** will continue serving requests but may return stale data.

## Trade-offs & Considerations

- Most systems make this choice **per data type**: financial records favor consistency, social media counts favor availability.

---

_Notes: (add your own content here)_
