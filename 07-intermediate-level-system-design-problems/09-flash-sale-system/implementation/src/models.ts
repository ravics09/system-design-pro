import { Schema, model } from 'mongoose';

// One order per reservationId → idempotent confirm (retries don't double-create).
const orderSchema = new Schema(
  {
    reservationId: { type: String, unique: true },
    item: String,
    userId: String,
    status: { type: String, default: 'paid' },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

export const Order = model('Order', orderSchema);
