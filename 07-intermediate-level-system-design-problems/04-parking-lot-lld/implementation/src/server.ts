import express from 'express';
import { ParkingLot } from './parking-lot';
import { Size } from './domain';

const port = Number(process.env.PORT ?? 3104);
const lot = new ParkingLot({
  levels: Number(process.env.LEVELS ?? 2),
  perLevel: {
    [Size.MOTORCYCLE]: Number(process.env.SPOTS_MOTORCYCLE ?? 2),
    [Size.COMPACT]: Number(process.env.SPOTS_COMPACT ?? 4),
    [Size.LARGE]: Number(process.env.SPOTS_LARGE ?? 2),
  },
});

const SIZE_INPUT: Record<string, Size> = { motorcycle: Size.MOTORCYCLE, compact: Size.COMPACT, large: Size.LARGE };

const app = express();
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/api/availability', (_req, res) => res.json(lot.availability()));

app.post('/api/park', (req, res) => {
  const plate = String(req.body?.plate ?? '').trim();
  const size = SIZE_INPUT[String(req.body?.size ?? 'compact')];
  if (!plate || size === undefined) return res.status(400).json({ error: 'plate and valid size required' });
  const ticket = lot.park({ plate, size });
  if (!ticket) return res.status(409).json({ error: 'lot full for this size' });
  res.status(201).json(ticket);
});

app.post('/api/unpark', (req, res) => {
  const ticketId = String(req.body?.ticketId ?? '');
  const result = lot.unpark(ticketId);
  if (!result) return res.status(404).json({ error: 'unknown or already-closed ticket' });
  res.json(result);
});

app.listen(port, () => console.log(`[parking-lot] listening on :${port}`));
