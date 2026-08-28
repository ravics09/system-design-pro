# Web — API console

Next.js 14 (App Router) + Redux Toolkit **RTK Query** console for the NestJS API platform. Each button
fires a real request and the response panel visualizes all three concerns: the success/error envelope,
the API version, the deprecation banner, and the request id (both `meta.requestId` and the
`X-Request-Id` response header, side by side so you can confirm they match).

## Run

> npm is under nvm here; if `npm` is missing, run `export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"` first.

Start the API first (see [`../server/README.md`](../server/README.md)), then:

```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_BASE_URL=http://localhost:3008
npm install
npm run dev                  # http://localhost:3000
# production build / type-check:
npm run build
npm run typecheck
```

## How it works

- `src/store/apiConsoleApi.ts` — the RTK Query slice. Every endpoint is a **mutation** so each click
  re-fires (instead of returning a cached query result). `validateStatus: () => true` lets error
  envelopes (`404` / `400`) arrive as data, and `transformResponse` reads the transport facts off the
  raw `Response` (`meta.response`): HTTP status plus the `X-Request-Id` / `Deprecation` / `Sunset`
  headers — this is how the frontend reads response headers through RTK Query.
- `src/components/ResultView.tsx` — renders the badges (HTTP status, envelope, version, error code,
  `meta.requestId` vs `X-Request-Id`, pagination) and the deprecation banner.
- `src/components/Console.tsx` — the interactive panels (list v1/v2, get-by-id, create with validation,
  trace-demo).
- `src/types.ts` — mirrors the server envelope types.
