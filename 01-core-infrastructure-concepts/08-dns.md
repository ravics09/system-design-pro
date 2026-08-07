# DNS (Domain Name System)

> **In one line:** Translates human-readable domain names into IP addresses.

## Overview

DNS translates human-readable domain names like `example.com` into IP addresses that computers use to find each other. It is the internet's directory service.

## Key Idea

DNS matters in system design because it can be used for **traffic routing** — directing users to different servers based on their geographic location or on the health of the servers.

## Trade-offs & Considerations

- Simple mechanism for geographic and health-based routing.
- **Slow to respond to changes** because DNS records are cached by clients and intermediate resolvers.

---

_Notes: (add your own content here)_
