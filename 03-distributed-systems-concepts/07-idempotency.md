# Idempotency

> **In one line:** Performing an operation multiple times produces the same result as performing it once.

## Overview

An operation is idempotent if performing it multiple times produces the same result as performing it once.

- HTTP **GET** is naturally idempotent because reading the same resource twice leaves it unchanged.
- HTTP **POST** is not naturally idempotent because creating a resource twice creates two resources.

## Key Idea

Idempotency matters because distributed systems cannot guarantee that a request is delivered exactly once. A request may be lost, the response may be lost, or the caller may retry without knowing whether the first attempt succeeded.

## Trade-offs & Considerations

- Idempotent operations are **safe to retry**.
- Non-idempotent operations that are retried can cause duplicates.

---

_Notes: (add your own content here)_
