# Consensus

> **In one line:** Getting multiple nodes to agree on a single value despite failures.

## Overview

Consensus is the problem of getting multiple nodes in a distributed system to agree on a single value despite failures. It is the foundation of leader election, distributed locking, and replicated logs.

## Key Idea

Algorithms like **Raft** and **Paxos** solve the consensus problem. They guarantee that a majority of nodes must agree before a value is committed, which prevents split-brain scenarios where two nodes both believe they are the leader.

## Trade-offs & Considerations

- Consensus is **expensive** because it requires multiple network round trips, so it is used only where agreement truly must be guaranteed.

---

_Notes: (add your own content here)_
