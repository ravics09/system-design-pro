import express from 'express';
import { CircuitBreaker, CircuitOpenError } from './circuit-breaker';

const port = Number(process.env.PORT ?? 3120);
const breaker = new CircuitBreaker({
  failureThreshold: Number(process.env.FAILURE_THRESHOLD ?? 5),
  resetTimeoutMs: Number(process.env.RESET_TIMEOUT_MS ?? 10_000),
});

// A simulated flaky downstream whose failure rate we can toggle at runtime.
let failRate = 0; // 0..1

async function flakyDownstream(): Promise<string> {
  // Timeout is essential: a "slow" dependency is what a breaker must catch.
  await new Promise((r) => setTimeout(r, 5));
  if (Math.random() < failRate) throw new Error('downstream error');
  return 'downstream ok';
}

const app = express();
app.use(express.json());
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Toggle the downstream health to watch the breaker open/close.
app.post('/api/downstream/fail-rate', (req, res) => {
  failRate = Math.min(1, Math.max(0, Number(req.body?.rate ?? 0)));
  res.json({ failRate });
});

app.get('/api/state', (_req, res) => res.json({ state: breaker.state }));

// Call the downstream THROUGH the breaker; fall back gracefully when open/failing.
app.get('/api/call', async (_req, res) => {
  try {
    const result = await breaker.call(flakyDownstream);
    res.json({ ok: true, result, state: breaker.state });
  } catch (err) {
    if (err instanceof CircuitOpenError) {
      return res.status(503).json({ ok: false, state: breaker.state, fallback: 'served cached/default (breaker open)' });
    }
    res.status(502).json({ ok: false, state: breaker.state, error: (err as Error).message });
  }
});

app.listen(port, () => console.log(`[circuit-breaker] listening on :${port}`));
