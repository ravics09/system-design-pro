# Index

> **In one line:** A data structure that makes certain queries faster.

## Overview

An index is a separate data structure that the database maintains to make certain queries faster. Without an index, finding rows that match a condition requires scanning every row in the table. With an index, the database can jump directly to the matching rows.

## Key Idea

The trade-off is that indexes **speed up reads but slow down writes**. Every insert, update, or delete must update all indexes on the affected table. A table with ten indexes pays ten times the write cost for index maintenance.

## Trade-offs & Considerations

- Good indexing means indexing the **queries you actually run**, not every column.

---

_Notes: (add your own content here)_
