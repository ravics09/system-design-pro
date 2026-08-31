# Server — contact-form pipeline (NestJS + Zod)

Validate → honeypot → per-IP rate limit → spam score → persist → async notify. No database.

## Run

> npm is under nvm here; if `npm` is missing, run `export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"` first.

```bash
npm install
npm run build && npm start   # http://localhost:3014
npm run start:dev
npm run typecheck
```

Config (`.env`): `PORT` (3014), `CORS_ORIGIN`, `RATE_MAX` (5), `RATE_WINDOW_MS` (60000),
`NOTIFY_FAILURE_RATE` (0..1 — inject mailer failures to see retries + DLQ), `NOTIFY_MAX_ATTEMPTS` (3).

## How it maps to the concepts

- `contact/contact.service.ts` — the pipeline: **idempotency** (repeat key → same record) → **honeypot**
  (filled hidden field → silently rejected) → **rate limit** (429) → **spam score** → **persist** (source
  of truth) → **enqueue** async notification. Responds fast.
- `contact/rate-limiter.ts` — a sliding-window per-IP limiter (`SlidingWindowLimiter`).
- `contact/spam.ts` — transparent heuristics → `{ score, reasons }` (links, all-caps, spam phrases, short
  message, disposable domain); thresholds flag/reject.
- `contact/notifier.ts` — async queue + worker; a failed send **retries with backoff** and after
  `maxAttempts` is **dead-lettered**. The `Sender` is injectable (tests supply a deterministic one).
