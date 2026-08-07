# Dead-Letter Queue

> **In one line:** Holds messages that failed to process after a set number of attempts.

## Overview

A dead-letter queue holds messages that failed to process after a set number of attempts. Rather than letting a bad message block the main queue by retrying indefinitely, the queue moves it aside after the retry limit is reached.

## Key Idea

- **Without** a dead-letter queue, one malformed message can stall processing for everything behind it.
- **With** one, the bad message is parked for inspection while the rest of the queue keeps flowing.

## Trade-offs & Considerations

- **Monitoring** the dead-letter queue is an essential part of operating any message-driven system.

---

_Notes: (add your own content here)_
