# Reverse Proxy

> **In one line:** Receives requests on behalf of servers and forwards them.

## Overview

A reverse proxy receives requests on behalf of one or more servers and forwards them. It sits between the client and the server, and the client does not know or need to know which actual server is handling the request.

## Key Idea

Reverse proxies handle caching, compression, SSL, and load balancing. They are closely related to load balancers but broader in purpose.

A **load balancer is a type of reverse proxy** specialized for traffic distribution, while a reverse proxy can do many other things as well.

## Trade-offs & Considerations

- Broader in purpose than a load balancer.
- Handles caching, compression, SSL termination, and routing.

---

_Notes: (add your own content here)_
