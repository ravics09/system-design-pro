# Web — config console (Next.js + RTK Query)

See the resolved config with a **source badge** on every key, reveal/mask secrets, edit runtime
overrides (with validation), toggle feature flags, inspect the layer breakdown, and roll back versions.

## Run

> npm is under nvm here; if `npm` is missing, run `export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"` first.

Start the API first (see [`../server/README.md`](../server/README.md)), then:

```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_BASE_URL=http://localhost:3011
npm install
npm run dev                  # http://localhost:3000
npm run build && npm run typecheck
```

## How it works

- `src/store/configApi.ts` — RTK Query slice for config, layers, meta, flags, versions, and the
  override/environment/flag/rollback/reset mutations.
- `src/components/ConfigTable.tsx` — one row per key: effective value, a **source badge** (defaults / env
  / env-vars / runtime), and an inline override editor (validation errors shown per key).
- `src/components/Console.tsx` — environment selector, reveal-secrets toggle, and the layer breakdown.
- `src/components/SidePanels.tsx` — feature-flag switches and the version history with per-version diffs
  and rollback.
