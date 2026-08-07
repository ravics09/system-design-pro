# Pub/Sub

> **In one line:** Producers publish to a topic; any number of consumers subscribe to receive copies.

## Overview

Publish-subscribe is a messaging pattern where producers publish messages to a topic and any number of consumers subscribe to receive copies. Unlike a queue where each message goes to one consumer, pub/sub **fans out** each message to all subscribers.

## Key Idea

Pub/sub is used when multiple independent parts of the system need to react to the same event. An "order placed" event might need to trigger inventory reservation, notification sending, and analytics recording simultaneously.

## Trade-offs & Considerations

- Pub/sub lets each consumer react without the producer knowing or caring who is listening.

---

_Notes: (add your own content here)_
