# Event Sourcing

> **In one line:** Stores state as the sequence of events that produced it, not as current values.

## Overview

Event sourcing stores the state of a system not as the current values but as the sequence of events that produced those values. Instead of storing that an account balance is one hundred dollars, the system stores all the transactions that led to that balance: deposit two hundred, withdraw fifty, withdraw fifty.

## Key Idea

The current state is derived by **replaying the events**. This provides a complete audit trail, makes it easy to rebuild derived data models, and enables time-travel queries that ask what the state was at any point in the past.

## Trade-offs & Considerations

- Complete audit trail and time-travel queries.
- Querying current state requires replaying potentially many events unless a **snapshot** is maintained.

---

_Notes: (add your own content here)_
