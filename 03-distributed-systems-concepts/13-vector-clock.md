# Vector Clock

> **In one line:** Tracks the causal order of events across nodes without synchronized clocks.

## Overview

A vector clock is a mechanism for tracking the causal order of events across distributed nodes without depending on synchronized clocks. Each node maintains a counter, and the vector clock captures which events causally precede which others.

## Key Idea

When a message is sent, the sender includes its current vector clock. The receiver updates its own clock by taking the maximum of each position. This allows the system to determine not just when events happened but **whether one event could have caused another**.

## Trade-offs & Considerations

- Provides the information needed to resolve conflicts in eventually consistent systems.

---

_Notes: (add your own content here)_
