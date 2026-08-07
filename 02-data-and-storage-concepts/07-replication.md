# Replication

> **In one line:** Keeps copies of data on multiple machines.

## Overview

Replication keeps copies of data on multiple machines. The most common pattern is **leader-follower**, where one primary node handles all writes and replica nodes hold copies that serve reads. This scales read capacity and provides redundancy.

## Key Idea

The important subtlety is **replication lag** — the delay between a write on the primary and its appearance on the replicas. During this window, reads from replicas return stale data.

## Trade-offs & Considerations

- Scales reads and provides redundancy.
- Replication lag is usually acceptable but must be handled deliberately when a read must reflect a recent write.

---

_Notes: (add your own content here)_
