# CDN (Content Delivery Network)

> **In one line:** Globally distributed servers that cache static content near users.

## Overview

A CDN is a network of servers distributed globally that cache copies of static content and serve them to users from the nearest location. Instead of every user fetching an image from a server on a different continent, they fetch it from a server in their city.

## Key Idea

CDNs reduce latency for content that does not change per user — such as images, videos, and scripts — and they offload an enormous amount of traffic from the origin server.

## Trade-offs & Considerations

- Great for static, non-personalized content.
- **Staleness:** cached content can become stale if it changes and the cache is not invalidated quickly.

---

_Notes: (add your own content here)_
