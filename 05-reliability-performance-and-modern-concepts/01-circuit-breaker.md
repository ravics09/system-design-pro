# Circuit Breaker

> **In one line:** Stops calling a dependency when its failure rate exceeds a threshold.

## Overview

A circuit breaker monitors calls to a dependency and stops making them when the failure rate exceeds a threshold. It has three states:

- **Closed** — normal operation.
- **Open** — dependency failing, all calls rejected immediately.
- **Half-open** — testing recovery with a small number of trial calls.

## Key Idea

The circuit breaker prevents a failing dependency from dragging down the service that depends on it. Without one, a slow or failing database causes application servers to accumulate waiting requests, eventually exhausting their resources and failing as well.

## Trade-offs & Considerations

- With one, the application **fails fast** when the dependency is unhealthy, freeing its resources and giving the dependency room to recover.

---

_Notes: (add your own content here)_
