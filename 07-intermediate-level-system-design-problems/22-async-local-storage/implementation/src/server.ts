import { randomUUID } from 'node:crypto';
import express from 'express';
import { getContext, log, runWithContext } from './context';

const port = Number(process.env.PORT ?? 3122);
const app = express();
app.use(express.json());

// Establish per-request context once at the edge; everything downstream reads it implicitly.
app.use((req, _res, next) => {
  const traceId = (req.headers['x-request-id'] as string) ?? randomUUID();
  const userId = (req.headers['x-user-id'] as string) ?? null;
  runWithContext({ traceId, userId }, () => next());
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Deep async work that reads the user/trace from context — no ctx argument threaded through.
async function loadProfile(): Promise<{ userId: string | null; note: string }> {
  await new Promise((r) => setTimeout(r, 5));
  const ctx = getContext();
  return { userId: ctx?.userId ?? null, note: 'resolved using AsyncLocalStorage context' };
}

app.get('/api/whoami', async (_req, res) => {
  const profile = await loadProfile();
  res.json({ ...profile, logLine: log('whoami handled') });
});

app.listen(port, () => console.log(`[als-context] listening on :${port}`));
