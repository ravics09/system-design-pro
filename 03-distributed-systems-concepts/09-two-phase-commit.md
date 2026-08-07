# Two-Phase Commit (2PC)

> **In one line:** A protocol for making a transaction atomic across multiple databases or services.

## Overview

Two-phase commit is a protocol for making a transaction atomic across multiple databases or services.

- **Prepare phase:** the coordinator asks all participants whether they can commit.
- **Commit phase:** if all say yes, the coordinator tells everyone to commit. If any say no, everyone aborts.

## Key Idea

The problem with 2PC is that participants **hold locks between the two phases**. If the coordinator crashes during this window, participants are blocked waiting indefinitely.

## Trade-offs & Considerations

- Fragile for large distributed systems, which is why the **Saga pattern** is more commonly used.

---

_Notes: (add your own content here)_
