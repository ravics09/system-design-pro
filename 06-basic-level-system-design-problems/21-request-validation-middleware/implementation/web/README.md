# Web — validation playground (Next.js + RTK Query)

Submit payloads and query strings and see the outcome: coerced/stripped values on success, or field-keyed
errors inline on failure, plus the size guard.

## Run

> npm is under nvm here; if `npm` is missing, run `export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"` first.

Start the API first (see [`../server/README.md`](../server/README.md)), then:

```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_BASE_URL=http://localhost:3013
npm install
npm run dev                  # http://localhost:3000
npm run build && npm run typecheck
```

## How it works

- `src/store/validationApi.ts` — RTK Query mutations (`createUser`, `search`, `dateRange`, `upload`) with
  `validateStatus: () => true` + `transformResponse` so 400/413 bodies come back as data and the HTTP
  status is read off `meta.response` — success and error render uniformly.
- `src/components/Playground.tsx` — an editable-JSON card per endpoint; `ResultView` shows the status
  badge, dot-path `fieldErrors`, top-level `formErrors`, and the raw envelope. Edit the `isAdmin` field to
  watch it get stripped, or break the email to see field errors.
