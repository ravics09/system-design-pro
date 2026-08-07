# Consistent Hashing Ring

> **In one line:** Arranges hash values in a circle, assigning each node a range of values.

## Overview

A consistent hashing ring arranges hash values in a circle and assigns each node responsibility for a range of values. Data is stored on the first node clockwise from its hash value. When a node is added or removed, only the keys in the adjacent range move to a different node.

## Key Idea

**Virtual nodes**, where each physical node occupies multiple positions on the ring, improve distribution uniformity and allow gradual capacity changes.

## Trade-offs & Considerations

- This is the standard technique behind distributed caches like **Redis Cluster**.

---

_Notes: (add your own content here)_
