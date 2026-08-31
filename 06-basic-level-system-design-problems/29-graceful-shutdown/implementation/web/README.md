# Web — lifecycle dashboard (Next.js + RTK Query)

Watch the server phase and in-flight counter live: launch slow requests, trigger a drain, and see new
requests rejected (503) while in-flight ones finish.

## Run

> npm is under nvm here; if `npm` is missing, run `export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"` first.

Start the API first (see [`../server/README.md`](../server/README.md)), then:

```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_BASE_URL=http://localhost:3016
npm install
npm run dev                  # http://localhost:3000
npm run build && npm run typecheck
```

## How it works

- `src/store/lifecycleApi.ts` — `getStatus` query polled every 400ms (phase + in-flight); `shutdown`,
  `reset`, and a `work` mutation (via `queryFn` with `validateStatus: () => true` so a 503 during drain
  renders as data).
- `src/components/Dashboard.tsx` — phase / in-flight / liveness / readiness badges, buttons to launch a
  slow (3s) or quick request, trigger shutdown, and reset, plus an activity log.

Try: launch the slow request, then **Trigger shutdown** — readiness flips to 503, new requests are
rejected, and the phase reaches `terminated` once the slow request finishes. **Reset** to run again.
