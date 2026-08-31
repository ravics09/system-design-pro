# Web — contact form + admin inbox (Next.js + RTK Query)

A public contact form (with a hidden honeypot + a client idempotency key) and an admin inbox that shows
each submission's status, spam score/reasons, and notification state — live.

## Run

> npm is under nvm here; if `npm` is missing, run `export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"` first.

Start the API first (see [`../server/README.md`](../server/README.md)), then:

```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_BASE_URL=http://localhost:3014
npm install
npm run dev                  # http://localhost:3000
npm run build && npm run typecheck
```

## How it works

- `src/store/contactApi.ts` — `submit` mutation sends an `x-idempotency-key` header; `list`/`stats`
  queries poll every 1.5s so the inbox and the **notify** column update live.
- `src/components/ContactForm.tsx` — the visible fields plus an off-screen **honeypot** (`website`) and a
  "simulate bot" toggle; regenerates the idempotency key after an accepted send.
- `src/components/AdminInbox.tsx` — filter by status; each row shows status, spam score + reasons, and the
  notification status (queued → sent, with attempt count).
