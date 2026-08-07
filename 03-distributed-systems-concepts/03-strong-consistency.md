# Strong Consistency

> **In one line:** Every read reflects the most recent write.

## Overview

Strong consistency means every read reflects the most recent write. No matter which node in a distributed system handles a read, it sees the latest data. Achieving this requires coordination between nodes on every write, which adds latency.

## Key Idea

Strong consistency is the right choice when serving stale data would cause a problem: bank balances, inventory levels, and seat availability for high-demand events.

## Trade-offs & Considerations

- The cost is **higher latency** and reduced availability during failures.

---

_Notes: (add your own content here)_
