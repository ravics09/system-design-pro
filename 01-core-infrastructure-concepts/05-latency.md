# Latency

> **In one line:** The time between sending a request and receiving a response.

## Overview

Latency is the time between sending a request and receiving a response. It is the delay a single user experiences. Low latency feels instant. High latency feels sluggish.

## Key Idea

Latency has multiple sources that **stack together**:

- The time for the request to travel over the network.
- The time the server spends processing it.
- The time the database spends answering the query.

Reducing latency means identifying which of these dominates and optimizing that specific part.

## Trade-offs & Considerations

- Latency is about the experience of a **single request**.
- Optimize the dominant source rather than guessing.

---

_Notes: (add your own content here)_
