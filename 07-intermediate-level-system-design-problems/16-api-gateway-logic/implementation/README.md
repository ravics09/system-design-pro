# API Gateway — implementation

A Node.js API gateway implementing the [design doc](../16-api-gateway-logic.md): one front door that
**routes by path prefix** to internal services and centralizes cross-cutting concerns — **edge auth** and
**per-client token-bucket rate limiting** — with two demo upstream services.

## Stack

- **Node.js + TypeScript + Express** (gateway forwards via `fetch`; no proxy library needed)
- Demo upstreams run from the same image (`dist/upstream.js`)

## Architecture

```mermaid
flowchart LR
  C["client"] --> GW["Gateway :3116<br/>rate limit + auth + route"]
  GW -->|/users/*| U["users-svc :4001"]
  GW -->|/orders/* (auth)| O["orders-svc :4002"]
```

## Endpoints

| Path | Routed to | Notes |
| --- | --- | --- |
| `/api/health` | — | Gateway liveness + route table |
| `/users/*` | users-svc | Public |
| `/orders/*` | orders-svc | Requires `Authorization: Bearer <GATEWAY_TOKEN>` |

## Design-doc mapping

- **Path routing** → longest-prefix `matchRoute` + `rewritePath` strips the prefix before forwarding.
- **Edge auth** → gateway checks the bearer token on protected routes (services trust the gateway).
- **Rate limiting** → per-IP `TokenBucket` (capacity + refill/sec) → 429 when exhausted.
- **Cross-cutting** → injects `x-request-id` + `x-forwarded-for`; returns 502 on unreachable upstream.
- **Stateless** → the gateway holds no per-request state → scale horizontally.

## Run it

```bash
docker compose up --build          # gateway on http://localhost:3116
curl localhost:3116/users/42
curl localhost:3116/orders            # 401
curl -H 'authorization: Bearer dev-token' localhost:3116/orders   # ok
```

```bash
npm install && npm test            # 5 unit tests (routing + token bucket)
npm run typecheck
```

## Verification

- `npm test` covers longest-prefix routing, path rewrite, token-bucket allow/limit/refill, and per-key
  isolation. `npm run typecheck` passes. End-to-end routing runs under `docker compose up`.
