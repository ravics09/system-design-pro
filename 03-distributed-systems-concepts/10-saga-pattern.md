# Saga Pattern

> **In one line:** A sequence of local transactions, each with a compensating action that undoes it on failure.

## Overview

The Saga pattern is an alternative to distributed transactions for operations that span multiple services. It breaks the operation into a sequence of local transactions, each with a compensating action that undoes it if a later step fails.

## Key Idea

If an order placement involves charging payment, reserving inventory, and creating a shipment, the saga runs each step locally. If the shipment creation fails, the saga runs the **compensating actions**: release the inventory and refund the payment.

## Trade-offs & Considerations

- The system reaches **eventual consistency through compensation** rather than atomicity.

---

_Notes: (add your own content here)_
