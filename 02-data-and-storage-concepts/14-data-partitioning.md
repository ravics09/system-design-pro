# Data Partitioning

> **In one line:** Dividing data into separate parts for storage or processing.

## Overview

Data partitioning is the general practice of dividing data into separate parts for storage or processing. Sharding is one form of partitioning. Time-based partitioning, where data for each month goes into a separate table, is another.

## Key Idea

Partitioning is done to:

- Improve query performance by scanning less data.
- Manage data lifecycle by archiving or deleting old partitions.
- Distribute load across machines.

## Trade-offs & Considerations

- The **partition key** determines which partition holds each piece of data and should be chosen based on the dominant query pattern.

---

_Notes: (add your own content here)_
