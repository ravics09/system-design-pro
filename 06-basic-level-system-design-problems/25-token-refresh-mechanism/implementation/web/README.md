# Web — auth console (Next.js + RTK Query)

Log in, watch the access token count down, refresh (rotating the refresh token), call `/me`, and run the
**reuse-attack** demo to see a whole token family get revoked.

## Run

> npm is under nvm here; if `npm` is missing, run `export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"` first.

Start the API first (see [`../server/README.md`](../server/README.md)), then:

```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_BASE_URL=http://localhost:3015
npm install
npm run dev                  # http://localhost:3000
npm run build && npm run typecheck
```

## How it works

- `src/store/authApi.ts` — `login`/`refresh`/`logout`/`me` mutations (`validateStatus: () => true` so 401s
  render), and a `sessions` query polled every 1.5s for the lineage table.
- `src/components/AuthConsole.tsx` — holds the current tokens + the just-rotated (now "used") one; the
  **Replay old token** button re-sends the used refresh token to trigger reuse detection, then proves the
  current token is dead too (family revoked). Includes a live access-token countdown.
- `src/components/SessionsTable.tsx` — the refresh-token families with `used`/`revoked` state.

Try: **Refresh** once, then **Replay old token (attack)** and watch the family go red in the table.
