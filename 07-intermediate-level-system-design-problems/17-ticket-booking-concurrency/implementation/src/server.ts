import express from 'express';
import mongoose from 'mongoose';
import { Seat } from './models';

const port = Number(process.env.PORT ?? 3117);
const holdTtlMs = Number(process.env.HOLD_TTL_MS ?? 120000);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/ticketing');

  // Reaper: release expired holds back to free (also handled lazily by the hold predicate).
  const reaper = setInterval(() => {
    Seat.updateMany(
      { status: 'held', heldUntil: { $lt: new Date() } },
      { $set: { status: 'free', heldBy: null, heldUntil: null } },
    ).catch(() => {});
  }, 5000);

  const app = express();
  app.use(express.json());
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.post('/api/events/:eventId/seats', async (req, res) => {
    const seatIds: string[] = Array.isArray(req.body?.seatIds) ? req.body.seatIds : [];
    await Seat.deleteMany({ eventId: req.params.eventId });
    await Seat.insertMany(seatIds.map((seatId) => ({ eventId: req.params.eventId, seatId })));
    res.status(201).json({ eventId: req.params.eventId, seats: seatIds.length });
  });

  app.get('/api/events/:eventId/seats', async (req, res) => {
    res.json({ seats: await Seat.find({ eventId: req.params.eventId }).sort({ seatId: 1 }).lean() });
  });

  // Atomic hold: succeeds only if the seat is free OR its previous hold expired. This single
  // conditional update is what prevents two users grabbing the same seat.
  app.post('/api/events/:eventId/seats/:seatId/hold', async (req, res) => {
    const userId = String(req.body?.userId ?? '').trim();
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const now = new Date();
    const held = await Seat.findOneAndUpdate(
      {
        eventId: req.params.eventId,
        seatId: req.params.seatId,
        $or: [{ status: 'free' }, { status: 'held', heldUntil: { $lt: now } }],
      },
      { $set: { status: 'held', heldBy: userId, heldUntil: new Date(Date.now() + holdTtlMs) } },
      { new: true },
    ).lean();
    if (!held) return res.status(409).json({ error: 'seat not available' });
    res.json({ seat: held, expiresInMs: holdTtlMs });
  });

  // Confirm: only the holder can turn their (unexpired) hold into a booking.
  app.post('/api/events/:eventId/seats/:seatId/confirm', async (req, res) => {
    const userId = String(req.body?.userId ?? '').trim();
    const booked = await Seat.findOneAndUpdate(
      { eventId: req.params.eventId, seatId: req.params.seatId, status: 'held', heldBy: userId, heldUntil: { $gt: new Date() } },
      { $set: { status: 'booked', heldUntil: null } },
      { new: true },
    ).lean();
    if (!booked) return res.status(410).json({ error: 'hold expired or not yours' });
    res.json({ seat: booked });
  });

  const server = app.listen(port, () => console.log(`[ticketing] listening on :${port}`));
  process.on('SIGTERM', () => { clearInterval(reaper); server.close(); });
}

main().catch((err) => { console.error('fatal', err); process.exit(1); });
