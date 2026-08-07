# Server-Sent Events (SSE)

> **In one line:** Streams one-way updates from server to client over a single open HTTP connection.

## Overview

Server-Sent Events is a protocol for streaming one-way updates from a server to a client over a single HTTP connection that stays open. The server can push events to the client at any time, but the client cannot send data back over the same connection.

## Key Idea

SSE is simpler than WebSockets and includes built-in reconnection, making it the right choice when only the server needs to push data: live notifications, stock prices, AI response streaming, and dashboard updates.

## Trade-offs & Considerations

- The **lack of bidirectionality** is a feature rather than a limitation for these use cases.

---

_Notes: (add your own content here)_
