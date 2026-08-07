# Load Balancer

> **In one line:** Distributes incoming requests across a group of servers.

## Overview

A load balancer sits in front of a group of servers and distributes incoming requests across them. Every request goes to the load balancer first. The balancer picks a server, forwards the request, and returns the response.

From the outside, it looks like one server. On the inside, many servers are sharing the work.

## Key Idea

A load balancer also **checks the health** of servers behind it and stops sending traffic to ones that are failing. This automatic detection and rerouting is what makes a fleet of servers resilient to individual failures.

## Trade-offs & Considerations

- Enables horizontal scaling by spreading load.
- Provides resilience via health checks and automatic rerouting.
- Must itself be highly available (often deployed redundantly).

---

_Notes: (add your own content here)_
