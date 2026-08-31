# Server — config engine (NestJS + Zod)

Resolves configuration from ordered layers with per-key provenance, validates + coerces it, masks
secrets, serves feature flags, and keeps a versioned audit trail. No database.

## Run

> npm is under nvm here; if `npm` is missing, run `export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"` first.

```bash
npm install
npm run build && npm start   # http://localhost:3011  (APP_ENV controls the active env layer)
npm run start:dev
npm run typecheck
```

Config (`.env`): `PORT` (3011), `CORS_ORIGIN`, `APP_ENV` (`local`|`dev`|`prod`).

## How it maps to the concepts

- `engine/layers.ts` — the ordered sources: `DEFAULTS`, per-environment files, `ENV_VARS` (note `PORT` is
  a **string** `"9090"` to demonstrate coercion), and the mutable runtime layer.
- `engine/resolver.ts` — merges layers low→high (later wins), records which layer supplied each key
  (**provenance**), then validates with Zod; invalid config throws `ConfigValidationError` (fail fast).
- `engine/schema.ts` — the managed schema with coercion (string `"false"` → boolean), secret markers, and
  `maskSecret`/`maskConfig`.
- `engine/history.ts` — append-only `VersionHistory` with per-change diffs and rollback.
- `engine/engine.ts` — validates on every write, records a version, and exposes reads/flags/rollback.

Note the distinction: `src/config.ts` is the **service's own** runtime env; `engine/*` is the config the
service **manages**.
