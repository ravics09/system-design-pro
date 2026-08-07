# Load Shedding

> **In one line:** Deliberately rejecting excess requests when a system is overloaded.

## Overview

Load shedding is the deliberate rejection of excess requests when a system is overloaded. Rather than trying to serve all requests poorly and collapsing, the system serves what it can handle well and declines the rest with a clear signal to retry later.

## Key Idea

Load shedding is the principle that **partial availability is better than total failure**. A system that serves eighty percent of requests successfully is far more useful than one that attempts all requests and fails all of them.

## Trade-offs & Considerations

- Shedding should be **prioritized**, dropping lower-priority work first to preserve capacity for the most critical operations.

---

_Notes: (add your own content here)_
