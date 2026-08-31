# Server — request-validation layer (NestJS + Zod)

A reusable validation pipe + size/depth guard. No database — `npm install` is all it needs.

## Run

> npm is under nvm here; if `npm` is missing, run `export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"` first.

```bash
npm install
npm run build && npm start   # http://localhost:3013
npm run start:dev
npm run typecheck
```

Config (`.env`): `PORT` (3013), `CORS_ORIGIN`, `MAX_BODY_BYTES` (10240), `MAX_DEPTH` (6).

## How it maps to the concepts

- `validation/validate.ts` — `validate(schema, input)` **parses** (coerces, applies defaults, strips
  unknown keys) and returns either the typed value or `{ fieldErrors, formErrors }` with **dot-path**
  keys built from the Zod issues.
- `validation/zod-validation.pipe.ts` — wraps `validate` as a NestJS pipe; on failure throws a consistent
  `400 VALIDATION_ERROR` a UI can render inline. Used on body, query, and params.
- `validation/size.guard.ts` — a `CanActivate` guard that runs **before** the pipe: rejects bodies over
  `MAX_BODY_BYTES` (413) or nested past `MAX_DEPTH` (400) — a fail-fast DoS guard.
- `validation/schemas.ts` — nested `address`, a `search` schema with query coercion (+ a `boolish` that
  treats `"false"` as `false`), a positive-integer id param, and a cross-field `.refine`. `z.object`
  **strips unknown keys** by default (mass-assignment defense).
