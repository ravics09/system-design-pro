# Message Queue

> **In one line:** Holds messages from producers until consumers are ready to process them.

## Overview

A message queue is a component that holds messages from producers until consumers are ready to process them. The producer sends a message and moves on without waiting for the consumer to finish. The consumer processes messages at its own pace.

## Key Idea

Message queues **decouple producers from consumers in time**, which absorbs traffic spikes and allows the two sides to scale independently.

## Trade-offs & Considerations

- The trade-off is that results are **not immediately available** since processing happens asynchronously.

---

_Notes: (add your own content here)_
