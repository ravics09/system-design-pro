# API Gateway

> **In one line:** A single entry point handling cross-cutting concerns in front of backend services.

## Overview

An API gateway is a single entry point that sits in front of multiple backend services and handles cross-cutting concerns like authentication, rate limiting, SSL termination, and request routing in one place.

## Key Idea

Without a gateway, every service must implement authentication and rate limiting independently. With a gateway, these concerns are **centralized** and every service behind it gets them for free.

## Trade-offs & Considerations

- Centralizes auth, rate limiting, SSL termination, and routing.
- The gateway becomes a **critical component** that must be highly available and must not become a bottleneck.

---

_Notes: (add your own content here)_
