import express from 'express';

// A tiny demo upstream service. Started with SERVICE_NAME + PORT env; the gateway routes to it.
const port = Number(process.env.PORT ?? 4001);
const service = process.env.SERVICE_NAME ?? 'users';

const app = express();
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service }));
app.all('*', (req, res) => {
  res.json({ service, method: req.method, path: req.path, requestId: req.headers['x-request-id'] ?? null, body: req.body ?? null });
});

app.listen(port, () => console.log(`[upstream:${service}] listening on :${port}`));
