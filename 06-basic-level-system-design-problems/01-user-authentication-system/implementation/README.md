# User Authentication System — Reference Implementation

A production-shaped TypeScript/Node.js implementation of the design in
[`../01-user-authentication-system.md`](../01-user-authentication-system.md).

It demonstrates the full authentication lifecycle:

- **Registration** with **Argon2id** password hashing (never plaintext).
- **Login** issuing a **short-lived JWT access token** + a **long-lived refresh token**.
- **Refresh-token rotation with reuse detection** (theft of a rotated token revokes the whole family).
- **Stateless access-token validation** (local verify, algorithm pinned — no DB hit on the hot path).
- **RBAC** via a separate `authorize` middleware (401 vs 403).
- **Logout**, **logout-everywhere** (`tokenVersion` bump), **change / forgot / reset password**.
- **Rate limiting** on auth endpoints (Redis in prod, in-memory in dev).
- **Refresh token in a Secure, HttpOnly, SameSite cookie**; access token in the response body.

## Design decisions (mapped to the write-up)

| Decision | Where | Why |
|---|---|---|
| Argon2id, not SHA-256 | `utils/password.ts` | Slow, memory-hard — brute force is expensive |
| `passwordHash` `select:false` | `models/user.model.ts` | Never leaked by default queries |
| Access = JWT, refresh = opaque | `utils/jwt.ts`, `utils/tokens.ts` | Stateless access checks; revocable, hashed refresh |
| Store only refresh-token **hash** | `models/session.model.ts` | A DB leak can't hand out usable tokens |
| Rotation + reuse detection | `auth.service.ts#refresh` | Detect replay → revoke the token family |
| `tokenVersion` | `user.model.ts`, `logoutAll`/`changePassword` | Invalidate all tokens on logout-all / password change |
| Pinned JWT algorithm | `utils/jwt.ts` | Blocks `alg:none` / confusion attacks |
| Generic login error + dummy hash | `auth.service.ts#login` | Prevents account enumeration (content + timing) |
| authenticate ≠ authorize | `middleware/` | 401 = who are you, 403 = not allowed |
| HttpOnly SameSite refresh cookie | `auth.controller.ts` | Mitigates XSS token theft; scoped to `/auth` |

## Project layout

```
src/
├── config/            # zod-validated env config, roles, cookie constants
├── types/             # AccessTokenClaims, AuthUser, AuthedRequest, TokenPair
├── errors/            # typed HTTP errors
├── lib/               # db (mongoose), logger
├── models/            # user, session (refresh lineage), passwordResetToken
├── utils/             # password (argon2), jwt (access), tokens (opaque + hash)
├── middleware/        # authenticate, authorize, rateLimiter, validate, errorHandler
├── modules/
│   ├── auth/          # register/login/refresh/logout/logout-all/password flows
│   └── user/          # sample protected routes (RBAC demo)
├── app.ts             # express wiring
└── server.ts          # bootstrap + graceful shutdown
```

## Running locally

Requires Node ≥ 20 and a MongoDB instance. Redis is optional in dev
(`RATE_LIMIT_DRIVER=memory`).

```bash
npm install
cp .env.example .env       # set a strong JWT_ACCESS_SECRET for anything real
npm run typecheck          # tsc --noEmit
npm run dev                # start on :3000
```

## API

All routes are under `/api/v1`. The refresh token is set/read as an HttpOnly
cookie automatically; send the access token as `Authorization: Bearer <token>`.

### Register (auto-login)

```http
POST /api/v1/auth/register
Content-Type: application/json

{ "email": "ada@example.com", "password": "correct horse battery", "firstName": "Ada", "lastName": "Lovelace" }
```

```json
// 201 — refresh token set as HttpOnly cookie
{ "user": { "id": "...", "email": "ada@example.com", "role": "USER", ... }, "accessToken": "eyJ...", "expiresIn": 900 }
```

### Login / Refresh / Logout

```http
POST /api/v1/auth/login          # { email, password }  → access token + refresh cookie
POST /api/v1/auth/refresh        # uses refresh cookie   → new access token + rotated refresh cookie
POST /api/v1/auth/logout         # revokes current session, clears cookie
POST /api/v1/auth/logout-all     # (auth) bumps tokenVersion, revokes all sessions
```

### Profile & password management

```http
GET  /api/v1/auth/me                 # (auth) current user
POST /api/v1/auth/change-password    # (auth) { currentPassword, newPassword }
POST /api/v1/auth/forgot-password    # { email }        → always 200 (no enumeration)
POST /api/v1/auth/reset-password     # { token, newPassword }
```

The reset `token` is emailed out-of-band in production; here it is written to the
server logs by `requestPasswordReset` so you can test the flow.

### RBAC demo (in the user module)

```http
GET /api/v1/users/profile        # (auth) any logged-in user
GET /api/v1/users/admin/report   # (auth + ADMIN) → 403 for non-admins
```

## Notes & simplifications

- **HS256** shared secret is used for simplicity. For microservices, switch to **RS256** and publish
  public keys via JWKS (discussed in the write-up) so verifiers never hold the signing key.
- **Access-token revocation** is intentionally stateless: short TTL + `tokenVersion` (enforced on
  refresh). A per-request Redis version check could be added if immediate access-token revocation is
  required, at the cost of a hot-path lookup.
- **Email verification** and actual email sending are out of scope; the fields/hooks are present.
- This is teaching code — production-shaped but favouring clarity over exhaustive hardening (audit
  logging, MFA, key rotation, distributed tracing), all of which the write-up covers.
```
