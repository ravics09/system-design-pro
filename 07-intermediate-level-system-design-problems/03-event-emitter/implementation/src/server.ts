import express from 'express';
import type { Response } from 'express';
import { EventEmitter } from './event-emitter';

const port = Number(process.env.PORT ?? 3103);
const bus = new EventEmitter();
bus.maxListeners = 10_000; // one listener per connected SSE client

const app = express();
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// SSE: each client registers a listener on the bus; disconnect removes it (no leak).
app.get('/api/events', (req, res: Response) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  res.flushHeaders();
  const onBroadcast = (...args: unknown[]) => {
    const payload = args[0];
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };
  bus.on('broadcast', onBroadcast);
  req.on('close', () => bus.off('broadcast', onBroadcast)); // pair on() with off()
});

// Emit an event to all SSE listeners through our custom EventEmitter.
app.post('/api/emit', (req, res) => {
  const { event = 'broadcast', data } = req.body ?? {};
  const delivered = bus.emit(String(event), { event, data, at: Date.now() });
  res.json({ delivered, listeners: bus.listenerCount(String(event)) });
});

app.listen(port, () => console.log(`[event-emitter] listening on :${port}`));
