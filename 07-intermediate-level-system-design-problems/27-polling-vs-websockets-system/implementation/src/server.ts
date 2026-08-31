import http from 'node:http';
import express from 'express';
import { WebSocketServer } from 'ws';
import { Tracker, type Position } from './tracker';

const port = Number(process.env.PORT ?? 3127);
const tickMs = Number(process.env.TICK_MS ?? 1000);

const tracker = new Tracker();
setInterval(() => tracker.update(), tickMs); // simulate a moving delivery

const app = express();
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// 1) SHORT POLLING: ask on a timer; returns current state (may be unchanged → wasteful).
app.get('/api/poll', (_req, res) => res.json({ transport: 'short-poll', ...tracker.current() }));

// 2) LONG POLLING: hold the request until state is newer than ?since, then respond.
app.get('/api/longpoll', (req, res) => {
  const since = Number(req.query.since ?? -1);
  const immediate = tracker.since(since);
  if (immediate) return res.json({ transport: 'long-poll', ...immediate });
  const onUpdate = (p: Position) => { cleanup(); res.json({ transport: 'long-poll', ...p }); };
  const timeout = setTimeout(() => { cleanup(); res.json({ transport: 'long-poll', timeout: true, ...tracker.current() }); }, 25_000);
  const cleanup = () => { clearTimeout(timeout); tracker.off('update', onUpdate); };
  tracker.on('update', onUpdate);
  req.on('close', cleanup);
});

// 3) SSE: one long-lived stream; server pushes each update (great for one-way live data).
app.get('/api/stream', (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  res.flushHeaders();
  res.write(`data: ${JSON.stringify(tracker.current())}\n\n`);
  const onUpdate = (p: Position) => res.write(`id: ${p.version}\ndata: ${JSON.stringify(p)}\n\n`);
  tracker.on('update', onUpdate);
  req.on('close', () => tracker.off('update', onUpdate));
});

const server = http.createServer(app);

// 4) WEBSOCKET: full-duplex; here used to push updates (needed when the client also sends data).
const wss = new WebSocketServer({ server, path: '/ws' });
wss.on('connection', (ws) => {
  ws.send(JSON.stringify(tracker.current()));
  const onUpdate = (p: Position) => ws.readyState === ws.OPEN && ws.send(JSON.stringify(p));
  tracker.on('update', onUpdate);
  ws.on('close', () => tracker.off('update', onUpdate));
});

server.listen(port, () => console.log(`[polling-ws] listening on :${port} (HTTP + /ws)`));
