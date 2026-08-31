import express from 'express';
import { Redis } from 'ioredis';
import { Leaderboard } from './leaderboard';

const port = Number(process.env.PORT ?? 3108);
const redis = new Redis(process.env.REDIS_URL ?? 'redis://127.0.0.1:6379');
const lb = new Leaderboard(redis);

const app = express();
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.post('/api/boards/:board/score', async (req, res) => {
  const userId = String(req.body?.userId ?? '').trim();
  const { score, delta } = req.body ?? {};
  if (!userId) return res.status(400).json({ error: 'userId required' });
  if (typeof delta === 'number') {
    return res.json({ userId, score: await lb.increment(req.params.board, userId, delta) });
  }
  if (typeof score === 'number') {
    await lb.submit(req.params.board, userId, score);
    return res.json({ userId, score });
  }
  res.status(400).json({ error: 'provide numeric score or delta' });
});

app.get('/api/boards/:board/top', async (req, res) => {
  const n = Math.min(1000, Math.max(1, Number(req.query.n ?? 10)));
  res.json({ top: await lb.top(req.params.board, n) });
});

app.get('/api/boards/:board/players/:userId', async (req, res) => {
  const { board, userId } = req.params;
  const [rank, score, around] = await Promise.all([
    lb.rankOf(board, userId),
    lb.scoreOf(board, userId),
    lb.around(board, userId, Number(req.query.radius ?? 3)),
  ]);
  if (rank == null) return res.status(404).json({ error: 'player not on this board' });
  res.json({ userId, rank, score, around });
});

app.listen(port, () => console.log(`[leaderboard] listening on :${port}`));
