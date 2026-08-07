# Backpressure

> **In one line:** A consumer signals a producer to slow down when it cannot keep pace.

## Overview

Backpressure is a mechanism where a consumer signals to a producer to slow down when it cannot keep pace. Without backpressure, a fast producer and a slow consumer leads to an unbounded queue that grows until memory is exhausted.

## Key Idea

Backpressure makes overload **visible and manageable** rather than letting it accumulate silently.

## Trade-offs & Considerations

- Implemented through bounded queues that reject new messages when full, forcing the producer to wait or slow down.
- Or through explicit flow control signals from consumer to producer.

---

_Notes: (add your own content here)_
