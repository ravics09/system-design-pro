# Horizontal Scaling

> **In one line:** Adding more machines instead of making one bigger.

## Overview

Horizontal scaling means adding more machines instead of making one bigger. When the system needs more capacity, you run more copies of it across more servers. There is no ceiling, and the failure of one machine reduces capacity slightly rather than causing a total outage.

## Key Idea

Horizontal scaling requires the servers to be **stateless**, meaning they hold no information between requests that is specific to a particular user.

If a server holds state, requests must return to the same server, which breaks the flexibility that makes horizontal scaling work.

## Trade-offs & Considerations

- **No hard ceiling** on capacity.
- **Graceful degradation:** one machine failing only slightly reduces capacity.
- **Requires statelessness:** state must be externalized (e.g. to a cache or database).

---

_Notes: (add your own content here)_
