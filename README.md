# System Design Pro

A structured knowledge base for **system design interview preparation**. It organizes 50 essential
concepts into five sections, each concept in its own markdown file so it can be expanded and
refined over time.

> The 2026 edition reflects the reality that AI infrastructure concepts like embeddings and RAG are
> now standard system design vocabulary — as common in interviews as caching and sharding were five
> years ago.

## How to Use This Repo

Each concept lives in its own `.md` file grouped by section. Every file follows a consistent shape:
a one-line summary, an overview, the key idea, and the trade-offs. Start anywhere and expand the
`Notes` section with your own understanding.

## Table of Contents

### Section 1 — [Core Infrastructure Concepts](./01-core-infrastructure-concepts)
How traffic flows through a system, how it is distributed, and how the system grows.

| # | Concept |
|---|---------|
| 1 | [Scalability](./01-core-infrastructure-concepts/01-scalability.md) |
| 2 | [Vertical Scaling](./01-core-infrastructure-concepts/02-vertical-scaling.md) |
| 3 | [Horizontal Scaling](./01-core-infrastructure-concepts/03-horizontal-scaling.md) |
| 4 | [Load Balancer](./01-core-infrastructure-concepts/04-load-balancer.md) |
| 5 | [Latency](./01-core-infrastructure-concepts/05-latency.md) |
| 6 | [Throughput](./01-core-infrastructure-concepts/06-throughput.md) |
| 7 | [CDN (Content Delivery Network)](./01-core-infrastructure-concepts/07-cdn.md) |
| 8 | [DNS (Domain Name System)](./01-core-infrastructure-concepts/08-dns.md) |
| 9 | [API Gateway](./01-core-infrastructure-concepts/09-api-gateway.md) |
| 10 | [Reverse Proxy](./01-core-infrastructure-concepts/10-reverse-proxy.md) |

### Section 2 — [Data and Storage Concepts](./02-data-and-storage-concepts)
How data is stored, accessed, and kept consistent as the system scales.

| # | Concept |
|---|---------|
| 11 | [Database](./02-data-and-storage-concepts/01-database.md) |
| 12 | [SQL Database](./02-data-and-storage-concepts/02-sql-database.md) |
| 13 | [NoSQL Database](./02-data-and-storage-concepts/03-nosql-database.md) |
| 14 | [ACID](./02-data-and-storage-concepts/04-acid.md) |
| 15 | [Index](./02-data-and-storage-concepts/05-index.md) |
| 16 | [Sharding](./02-data-and-storage-concepts/06-sharding.md) |
| 17 | [Replication](./02-data-and-storage-concepts/07-replication.md) |
| 18 | [Cache](./02-data-and-storage-concepts/08-cache.md) |
| 19 | [Cache-Aside](./02-data-and-storage-concepts/09-cache-aside.md) |
| 20 | [Write-Through](./02-data-and-storage-concepts/10-write-through.md) |
| 21 | [Write-Behind](./02-data-and-storage-concepts/11-write-behind.md) |
| 22 | [Consistent Hashing](./02-data-and-storage-concepts/12-consistent-hashing.md) |
| 23 | [Object Storage](./02-data-and-storage-concepts/13-object-storage.md) |
| 24 | [Data Partitioning](./02-data-and-storage-concepts/14-data-partitioning.md) |
| 25 | [Event Sourcing](./02-data-and-storage-concepts/15-event-sourcing.md) |

### Section 3 — [Distributed Systems Concepts](./03-distributed-systems-concepts)
The fundamental challenges of running a system across multiple machines and the patterns that address them.

| # | Concept |
|---|---------|
| 26 | [Distributed System](./03-distributed-systems-concepts/01-distributed-system.md) |
| 27 | [CAP Theorem](./03-distributed-systems-concepts/02-cap-theorem.md) |
| 28 | [Strong Consistency](./03-distributed-systems-concepts/03-strong-consistency.md) |
| 29 | [Eventual Consistency](./03-distributed-systems-concepts/04-eventual-consistency.md) |
| 30 | [Consensus](./03-distributed-systems-concepts/05-consensus.md) |
| 31 | [Leader Election](./03-distributed-systems-concepts/06-leader-election.md) |
| 32 | [Idempotency](./03-distributed-systems-concepts/07-idempotency.md) |
| 33 | [Idempotency Key](./03-distributed-systems-concepts/08-idempotency-key.md) |
| 34 | [Two-Phase Commit (2PC)](./03-distributed-systems-concepts/09-two-phase-commit.md) |
| 35 | [Saga Pattern](./03-distributed-systems-concepts/10-saga-pattern.md) |
| 36 | [Consistent Hashing Ring](./03-distributed-systems-concepts/11-consistent-hashing-ring.md) |
| 37 | [Clock Skew](./03-distributed-systems-concepts/12-clock-skew.md) |
| 38 | [Vector Clock](./03-distributed-systems-concepts/13-vector-clock.md) |

### Section 4 — [Messaging and Communication Concepts](./04-messaging-and-communication-concepts)
How components communicate asynchronously and how real-time features are built at scale.

| # | Concept |
|---|---------|
| 39 | [Message Queue](./04-messaging-and-communication-concepts/01-message-queue.md) |
| 40 | [Pub/Sub](./04-messaging-and-communication-concepts/02-pub-sub.md) |
| 41 | [Dead-Letter Queue](./04-messaging-and-communication-concepts/03-dead-letter-queue.md) |
| 42 | [Backpressure](./04-messaging-and-communication-concepts/04-backpressure.md) |
| 43 | [WebSocket](./04-messaging-and-communication-concepts/05-websocket.md) |
| 44 | [Server-Sent Events (SSE)](./04-messaging-and-communication-concepts/06-server-sent-events.md) |

### Section 5 — [Reliability, Performance, and Modern Concepts](./05-reliability-performance-and-modern-concepts)
How systems stay up under stress and how AI capabilities are integrated into production architectures.

| # | Concept |
|---|---------|
| 45 | [Circuit Breaker](./05-reliability-performance-and-modern-concepts/01-circuit-breaker.md) |
| 46 | [Rate Limiting](./05-reliability-performance-and-modern-concepts/02-rate-limiting.md) |
| 47 | [Load Shedding](./05-reliability-performance-and-modern-concepts/03-load-shedding.md) |
| 48 | [Bloom Filter](./05-reliability-performance-and-modern-concepts/04-bloom-filter.md) |
| 49 | [Embedding](./05-reliability-performance-and-modern-concepts/05-embedding.md) |
| 50 | [RAG (Retrieval-Augmented Generation)](./05-reliability-performance-and-modern-concepts/06-rag.md) |

## Key Takeaways

- **Infrastructure** concepts describe how traffic flows through a system and how it grows.
- **Data & storage** concepts determine how data is stored, accessed, and kept consistent at scale.
- **Distributed systems** concepts describe the challenges of running across many machines.
- **Messaging** concepts describe asynchronous communication and real-time features.
- **Reliability & modern** concepts cover staying up under stress and integrating AI capabilities.

No concept exists in isolation. Understanding *why* each one exists, *what* problem it solves, and
*what it costs* is what turns a vocabulary list into the ability to design systems.
