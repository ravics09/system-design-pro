# Friend Request — Web (Next.js + Redux Toolkit)

A people directory where each person shows a **contextual action** based on the
relationship state, plus Friends / Incoming / Outgoing tabs — all driven by
**RTK Query** with tag invalidation.

## Layout

```
src/
├── app/ layout.tsx · page.tsx
├── components/
│   ├── Directory.tsx     # tabs (People/Friends/Incoming/Outgoing) + list
│   └── PersonRow.tsx     # per-status action buttons  ← the core
├── store/
│   ├── friendsApi.ts     # RTK Query: users / overview / request / respond / cancel / unfriend / block / unblock
│   ├── store.ts
│   └── Providers.tsx
├── lib/status.ts         # derive per-user status from the overview
└── types.ts
```

## How it works

A single `getOverview` query returns the current user's grouped relationships
(`friends`, `incoming`, `outgoing`, `blocked`, `blockedBy`). `statusFromOverview`
derives each person's status, and `PersonRow` renders the right actions:

```
NONE             → Add friend · Block
REQUEST_SENT     → Cancel request
REQUEST_RECEIVED → Accept · Decline
FRIENDS          → Unfriend · Block
BLOCKED          → Unblock
BLOCKED_BY       → (unavailable)
```

Every mutation invalidates the `Overview` tag, so the whole UI re-derives from one
fresh source — no manual state juggling.

## Run

```bash
npm install
cp .env.example .env.local     # NEXT_PUBLIC_API_BASE_URL=http://localhost:3006 · NEXT_PUBLIC_USER_ID=alice
npm run dev                    # http://localhost:3000
```

The API (in `../server`) must be running and seeded (`POST /users/seed`).

## Verify

```bash
npm run typecheck      # tsc --noEmit
npm run build          # next build (also type-checks)
```
