# Clock Skew

> **In one line:** The difference in time between clocks on different machines.

## Overview

Clock skew is the difference in time between clocks on different machines. Even with time synchronization protocols, clocks on different machines drift apart over time and can differ by milliseconds or more.

## Key Idea

Clock skew breaks any logic that relies on timestamps from different machines to establish event ordering. Two events with timestamps five milliseconds apart on different machines might have actually occurred in the opposite order.

## Trade-offs & Considerations

- Distributed systems use **logical clocks and vector clocks** instead of wall-clock time to establish causal ordering without depending on synchronized clocks.

---

_Notes: (add your own content here)_
