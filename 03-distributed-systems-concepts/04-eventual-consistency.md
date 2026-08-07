# Eventual Consistency

> **In one line:** Replicas converge to the same state over time but may differ briefly after a write.

## Overview

Eventual consistency means replicas will converge to the same state over time but may differ briefly after a write. A read immediately after a write might return the old value if it goes to a replica that has not yet received the update.

## Key Idea

Eventual consistency is cheaper and more available than strong consistency. It is the right choice when brief staleness is acceptable: like counts, follower counts, and recommendation scores.

## Trade-offs & Considerations

- The key is being **deliberate** about which data can tolerate staleness and which cannot.

---

_Notes: (add your own content here)_
