# Rate Limiting

> **In one line:** Caps how many requests a client can make in a given period.

## Overview

Rate limiting caps how many requests a client can make in a given period. When a client exceeds the limit, further requests are rejected with a specific status code until the limit resets.

## Key Idea

Rate limiting protects services from overload and abuse and ensures fair usage among all clients.

## Trade-offs & Considerations

- The **token bucket** algorithm is the most common implementation: each client has a bucket that fills with tokens at a fixed rate and empties as requests are made.
- This allows short bursts while enforcing a long-term average rate.

---

_Notes: (add your own content here)_
