# Leader Election

> **In one line:** Distributed nodes agreeing on which one coordinates work.

## Overview

Leader election is the process by which distributed nodes agree on which one is responsible for coordinating work. The leader handles writes, coordinates distributed operations, or manages resources that should not be duplicated.

## Key Idea

Leader election requires **consensus** to prevent two nodes from both believing they are the leader and accepting conflicting writes. When the leader fails, a new election runs among the remaining nodes.

## Trade-offs & Considerations

- The window between a leader failing and a new one being elected is a period of **reduced capability** during which the system cannot perform leader-dependent operations.

---

_Notes: (add your own content here)_
