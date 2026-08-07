# Consistent Hashing

> **In one line:** Distributes data across nodes while minimizing reshuffling when nodes change.

## Overview

Consistent hashing is a technique for distributing data across nodes that minimizes reshuffling when nodes are added or removed. In a standard hash ring, each node is responsible for a range of hash values. When a node is added or removed, only the keys in the adjacent range need to move.

## Key Idea

- **Without** consistent hashing, adding one node to a ten-node cluster might require moving ninety percent of the data.
- **With** consistent hashing, adding the same node requires moving roughly ten percent.

## Trade-offs & Considerations

- The standard technique for distributed caches and databases where the cluster size changes over time.

---

_Notes: (add your own content here)_
