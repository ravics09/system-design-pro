import { Schema, model } from 'mongoose';

const seatSchema = new Schema(
  {
    eventId: { type: String, required: true },
    seatId: { type: String, required: true },
    status: { type: String, default: 'free' }, // free | held | booked
    heldBy: { type: String, default: null },
    heldUntil: { type: Date, default: null },
  },
  { versionKey: false },
);

// One document per (event, seat); also the query key for atomic conditional updates.
seatSchema.index({ eventId: 1, seatId: 1 }, { unique: true });

export const Seat = model('Seat', seatSchema);
