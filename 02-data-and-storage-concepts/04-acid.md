# ACID

> **In one line:** The guarantees a database transaction provides — Atomicity, Consistency, Isolation, Durability.

## Overview

ACID stands for Atomicity, Consistency, Isolation, and Durability. It describes the guarantees that a database transaction provides.

- **Atomicity** — all operations in a transaction succeed or all fail together.
- **Consistency** — the database moves from one valid state to another valid state.
- **Isolation** — concurrent transactions do not interfere with each other.
- **Durability** — committed data survives a system crash.

## Key Idea

These guarantees are what make relational databases the right choice for financial transactions and other operations where **partial completion is worse than total failure**.

---

_Notes: (add your own content here)_
