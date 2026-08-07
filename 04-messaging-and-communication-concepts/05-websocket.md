# WebSocket

> **In one line:** A persistent bidirectional connection between a client and a server.

## Overview

A WebSocket is a protocol that establishes a persistent bidirectional connection between a client and a server. Once established, either side can send data at any time without the overhead of opening a new connection for each message.

## Key Idea

WebSockets are the right choice for real-time features that require low-latency bidirectional communication: chat, live collaboration, multiplayer games, and live trading.

## Trade-offs & Considerations

- The challenge at scale is that each WebSocket connection is **stateful and long-lived**, which means horizontal scaling requires a connection registry and a pub/sub backplane to route messages to the right server.

---

_Notes: (add your own content here)_
