# Server — token-refresh auth (NestJS + node:crypto)

HMAC-signed access tokens + server-tracked refresh tokens with rotation, reuse detection, and revocation.
No database, no external JWT library.

## Run

> npm is under nvm here; if `npm` is missing, run `export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"` first.

```bash
npm install
npm run build && npm start   # http://localhost:3015
npm run start:dev
npm run typecheck
```

Config (`.env`): `PORT` (3015), `CORS_ORIGIN`, `JWT_SECRET`, `ACCESS_TTL_S` (900), `REFRESH_TTL_S` (604800).
Demo users: `alice`/`password123`, `bob`/`hunter2`.

## How it maps to the concepts

- `auth/tokens.ts` — `signAccess`/`verifyAccess` (base64url payload + HMAC-SHA256, **constant-time**
  compare, expiry check — **no store lookup**); refresh tokens are an opaque id + signature.
- `auth/refresh-store.ts` — refresh records grouped into **families**; `issue`, `markUsed`, `revoke`,
  and `revokeFamily`.
- `auth/auth.service.ts` — `login` starts a family; `refresh` verifies + detects **reuse** of a used token
  → `revokeFamily` (theft containment) → 401, otherwise **rotates** (marks old used, issues a child);
  `logout` revokes (optionally the whole family); `me` verifies the access token statelessly.
