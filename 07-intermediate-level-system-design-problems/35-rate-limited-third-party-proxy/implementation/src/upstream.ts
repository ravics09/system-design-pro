import express from 'express';

// A bundled fake "restrictive third-party API" so the proxy demo is self-contained.
const port = Number(process.env.PORT ?? 4100);
let calls = 0;

const app = express();
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/:resource', (req, res) => {
  calls += 1;
  res.json({ resource: req.params.resource, servedByUpstreamCall: calls, at: Date.now() });
});

app.listen(port, () => console.log(`[fake-upstream] listening on :${port}`));
