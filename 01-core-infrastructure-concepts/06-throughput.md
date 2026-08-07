# Throughput

> **In one line:** How much work a system completes in a given period.

## Overview

Throughput is how much work a system completes in a given period, usually measured in requests per second. It describes the system's total capacity for work rather than the speed of any individual request.

## Key Idea

Latency and throughput are related but different:

- A system can be **fast for individual requests but slow in total** if it can only handle one at a time.
- A system can be **slow for individual requests but high throughput** if it processes many in parallel.

Designing for one does not automatically give you the other.

## Trade-offs & Considerations

- Throughput measures total capacity; latency measures per-request speed.
- Parallelism increases throughput but does not necessarily reduce latency.

---

_Notes: (add your own content here)_
