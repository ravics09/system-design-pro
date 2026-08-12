# Rapid-Fire Revision — 50 System Design Concepts

Quick question-and-answer flashcards for last-minute memory revision. Each concept is condensed into a
one-line question and a crisp answer you can skim right before an interview.

> Tip: Cover the answer, read the question, recall it out loud, then check yourself.

---

## Section 1 — Core Infrastructure Concepts

*How traffic flows through a system, how it is distributed, and how the system grows.*

**1. Scalability**
- **Q:** What is scalability?
- **A:** A system's ability to handle increased load by adding resources, ideally with proportional (not degrading) performance.

**2. Vertical Scaling**
- **Q:** What is vertical scaling (scaling up)?
- **A:** Adding more power (CPU, RAM, disk) to a single machine. Simple, but bounded by hardware limits and a single point of failure.

**3. Horizontal Scaling**
- **Q:** What is horizontal scaling (scaling out)?
- **A:** Adding more machines and distributing load across them. Near-unlimited growth, but requires load balancing and stateless/coordinated design.

**4. Load Balancer**
- **Q:** What does a load balancer do?
- **A:** Distributes incoming traffic across multiple servers (e.g., round-robin, least-connections) to improve availability and utilization.

**5. Latency**
- **Q:** What is latency?
- **A:** The time taken for a single request to travel and get a response — a measure of delay, usually in milliseconds.

**6. Throughput**
- **Q:** What is throughput?
- **A:** The number of requests/operations a system handles per unit of time (e.g., requests/sec). Low latency and high throughput are distinct goals.

**7. CDN (Content Delivery Network)**
- **Q:** What is a CDN?
- **A:** A geographically distributed network of edge servers that caches static content close to users, cutting latency and origin load.

**8. DNS (Domain Name System)**
- **Q:** What is DNS?
- **A:** The system that resolves human-readable domain names into IP addresses; can also route traffic (geo/weighted) and support failover.

**9. API Gateway**
- **Q:** What is an API gateway?
- **A:** A single entry point for clients that handles routing, authentication, rate limiting, and aggregation across backend services.

**10. Reverse Proxy**
- **Q:** What is a reverse proxy?
- **A:** A server that sits in front of backends, forwarding client requests and handling TLS termination, caching, and load distribution.

---

## Section 2 — Data and Storage Concepts

*How data is stored, accessed, and kept consistent as the system scales.*

**11. Database**
- **Q:** What is a database?
- **A:** An organized system for storing, retrieving, and managing data reliably, with querying and durability guarantees.

**12. SQL Database**
- **Q:** What defines a SQL (relational) database?
- **A:** Structured tables with fixed schemas and relationships, queried via SQL, offering strong consistency and ACID transactions.

**13. NoSQL Database**
- **Q:** What defines a NoSQL database?
- **A:** Flexible, schema-less stores (document, key-value, column, graph) built for scale and availability, often trading strict consistency.

**14. ACID**
- **Q:** What does ACID stand for?
- **A:** Atomicity, Consistency, Isolation, Durability — the properties that guarantee reliable database transactions.

**15. Index**
- **Q:** What is a database index?
- **A:** A data structure (often a B-tree) that speeds up reads on specific columns, at the cost of extra storage and slower writes.

**16. Sharding**
- **Q:** What is sharding?
- **A:** Horizontally partitioning data across multiple databases/nodes by a shard key so each holds a subset, enabling scale.

**17. Replication**
- **Q:** What is replication?
- **A:** Keeping copies of data on multiple nodes for high availability and read scaling (e.g., primary-replica setups).

**18. Cache**
- **Q:** What is a cache?
- **A:** A fast, temporary store (often in memory) for frequently accessed data to reduce latency and backend load.

**19. Cache-Aside**
- **Q:** What is the cache-aside pattern?
- **A:** App checks the cache first; on a miss it reads the DB, then populates the cache. The app manages caching logic (lazy loading).

**20. Write-Through**
- **Q:** What is write-through caching?
- **A:** Writes go to the cache and the database synchronously, keeping them consistent at the cost of higher write latency.

**21. Write-Behind**
- **Q:** What is write-behind (write-back) caching?
- **A:** Writes hit the cache immediately and are flushed to the DB asynchronously — fast writes, but risk of data loss on failure.

**22. Consistent Hashing**
- **Q:** What problem does consistent hashing solve?
- **A:** It maps keys to nodes so that adding/removing a node reshuffles only a small fraction of keys, minimizing rebalancing.

**23. Object Storage**
- **Q:** What is object storage?
- **A:** Storage that manages data as objects (data + metadata + ID) in a flat namespace (e.g., S3) — ideal for large, unstructured files.

**24. Data Partitioning**
- **Q:** What is data partitioning?
- **A:** Splitting a dataset into pieces (horizontal/rows, vertical/columns) to improve manageability, performance, and scalability.

**25. Event Sourcing**
- **Q:** What is event sourcing?
- **A:** Persisting state as an immutable, append-only log of events; current state is rebuilt by replaying them. Gives full audit history.

---

## Section 3 — Distributed Systems Concepts

*The fundamental challenges of running a system across multiple machines and the patterns that address them.*

**26. Distributed System**
- **Q:** What is a distributed system?
- **A:** Multiple independent machines that coordinate over a network and appear to users as a single coherent system.

**27. CAP Theorem**
- **Q:** What is the CAP theorem?
- **A:** Under a network partition, a distributed system can guarantee only two of Consistency, Availability, and Partition tolerance — effectively a choice between C and A.

**28. Strong Consistency**
- **Q:** What is strong consistency?
- **A:** Every read returns the most recent write; all nodes see the same data at the same time. Higher latency, simpler correctness.

**29. Eventual Consistency**
- **Q:** What is eventual consistency?
- **A:** Given no new writes, replicas converge to the same value over time. Highly available; reads may be temporarily stale.

**30. Consensus**
- **Q:** What is consensus?
- **A:** The process by which distributed nodes agree on a single value/state despite failures (e.g., Paxos, Raft).

**31. Leader Election**
- **Q:** What is leader election?
- **A:** Choosing one node to coordinate actions (e.g., accept writes); if it fails, a new leader is elected automatically.

**32. Idempotency**
- **Q:** What is idempotency?
- **A:** An operation that produces the same result no matter how many times it's applied — safe to retry without side effects.

**33. Idempotency Key**
- **Q:** What is an idempotency key?
- **A:** A unique client-supplied token attached to a request so the server can detect and dedupe retries of the same operation.

**34. Two-Phase Commit (2PC)**
- **Q:** What is two-phase commit?
- **A:** A distributed transaction protocol: a coordinator asks all participants to prepare (vote), then commit/abort. Correct but blocking.

**35. Saga Pattern**
- **Q:** What is the saga pattern?
- **A:** A sequence of local transactions across services, each with a compensating action to undo prior steps on failure — a non-blocking alternative to 2PC.

**36. Consistent Hashing Ring**
- **Q:** What is a consistent hashing ring?
- **A:** A circular hash space where nodes and keys are placed; a key maps to the next node clockwise, with virtual nodes for balance.

**37. Clock Skew**
- **Q:** What is clock skew?
- **A:** The difference in time reported by clocks on different machines, which complicates ordering events in distributed systems.

**38. Vector Clock**
- **Q:** What is a vector clock?
- **A:** A per-node counter vector used to track causal ordering of events and detect concurrent updates/conflicts.

---

## Section 4 — Messaging and Communication Concepts

*How components communicate asynchronously and how real-time features are built at scale.*

**39. Message Queue**
- **Q:** What is a message queue?
- **A:** A buffer that lets producers send messages consumed later by consumers, decoupling services and smoothing load.

**40. Pub/Sub**
- **Q:** What is publish/subscribe?
- **A:** A messaging model where publishers emit messages to topics and any number of subscribers receive them — one-to-many, decoupled.

**41. Dead-Letter Queue**
- **Q:** What is a dead-letter queue (DLQ)?
- **A:** A holding queue for messages that repeatedly fail processing, so they can be inspected and retried without blocking the main queue.

**42. Backpressure**
- **Q:** What is backpressure?
- **A:** A mechanism to signal/slow a fast producer when a consumer can't keep up, preventing overload and resource exhaustion.

**43. WebSocket**
- **Q:** What is a WebSocket?
- **A:** A persistent, full-duplex TCP connection enabling real-time, bidirectional communication between client and server.

**44. Server-Sent Events (SSE)**
- **Q:** What are Server-Sent Events?
- **A:** A one-way channel where the server streams updates to the client over a single long-lived HTTP connection.

---

## Section 5 — Reliability, Performance, and Modern Concepts

*How systems stay up under stress and how AI capabilities are integrated into production architectures.*

**45. Circuit Breaker**
- **Q:** What is a circuit breaker?
- **A:** A pattern that stops calling a failing dependency after a threshold of errors, failing fast and allowing recovery (open/half-open/closed states).

**46. Rate Limiting**
- **Q:** What is rate limiting?
- **A:** Capping how many requests a client can make in a window (e.g., token bucket) to protect resources and ensure fairness.

**47. Load Shedding**
- **Q:** What is load shedding?
- **A:** Deliberately dropping or rejecting lower-priority requests under overload to keep the system stable for critical traffic.

**48. Bloom Filter**
- **Q:** What is a Bloom filter?
- **A:** A space-efficient probabilistic structure that tests set membership; false positives possible, false negatives impossible.

**49. Embedding**
- **Q:** What is an embedding?
- **A:** A dense numerical vector representing data (text, images) so that semantic similarity maps to closeness in vector space.

**50. RAG (Retrieval-Augmented Generation)**
- **Q:** What is RAG?
- **A:** An AI pattern that retrieves relevant documents (often via vector search) and feeds them to an LLM to ground responses in real data.

---

## 60-Second Recap

- **Infrastructure:** scale up vs. out, balance load, cut latency with CDNs/caches, route via DNS/gateway/proxy.
- **Data:** pick SQL vs. NoSQL, index reads, shard/partition/replicate for scale, choose the right cache-write strategy.
- **Distributed:** CAP forces C-vs-A tradeoffs; use consensus, idempotency, and sagas instead of blocking 2PC.
- **Messaging:** queues and pub/sub decouple services; DLQs and backpressure keep them healthy; WebSockets/SSE enable real time.
- **Reliability & modern:** circuit breakers, rate limiting, and load shedding keep systems up; embeddings and RAG bring AI into the stack.
