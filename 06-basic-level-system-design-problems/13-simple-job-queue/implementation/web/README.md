# Web — queue dashboard

Next.js 14 (App Router) + Redux Toolkit **RTK Query** dashboard for the job/task queue. Enqueue jobs and
watch them move through `waiting → active → completed`, retry with backoff, or land in the dead-letter
queue — all live.

## Run

> npm is under nvm here; if `npm` is missing, run `export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"` first.

Start the API first (see [`../server/README.md`](../server/README.md)), then:

```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_BASE_URL=http://localhost:3009
npm install
npm run dev                  # http://localhost:3000
# production build / type-check:
npm run build
npm run typecheck
```

## How it works

- `src/store/queueApi.ts` — the RTK Query slice. `getStats`, `getJobs`, and `getWorkers` are **queries**;
  the components subscribe with `pollingInterval: 1000` so the board refreshes every second as jobs move.
  `enqueue`, `retryDead`, the worker controls, and `reset` are **mutations** that invalidate the relevant
  tags for an immediate refresh.
- `src/components/EnqueueForm.tsx` — shapes job behavior via the payload (`latencyMs`, `failTimes`,
  `alwaysFail`) plus `priority`, `delayMs`, and `maxAttempts`; can enqueue a batch at once.
- `src/components/StatsPanel.tsx` — counts per state, cumulative totals, backlog, and oldest-waiting age.
- `src/components/JobsTable.tsx` — filter by state, see attempts/priority/last error, and **re-drive**
  dead-lettered jobs.
- `src/components/WorkerControls.tsx` — pause/resume the pool, scale concurrency, reset the queue.

## Things to try

1. Enqueue with `failTimes=1` → it fails once, backs off, then completes on attempt 2.
2. Enqueue with `alwaysFail` and `maxAttempts=2` → it exhausts retries and lands in **dead**; re-drive it.
3. Enqueue a batch, then **pause** workers and watch the `waiting` backlog grow; **resume** to drain it.
4. Enqueue a high `priority` job behind others → it jumps the line. A `delayMs` job waits, then runs.
