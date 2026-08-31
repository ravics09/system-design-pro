import { Schema, model } from 'mongoose';

export const Order = model(
  'Order',
  new Schema({ item: String, qty: Number, createdAt: { type: Date, default: Date.now } }, { versionKey: false }),
);

// One record per idempotency key (unique). `expiresAt` + TTL index bounds retention.
const keySchema = new Schema(
  {
    key: { type: String, unique: true },
    fingerprint: String,
    status: { type: String, default: 'pending' }, // pending | completed
    statusCode: Number,
    responseBody: Schema.Types.Mixed,
    expiresAt: Date,
  },
  { versionKey: false },
);
keySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const IdempotencyKey = model('IdempotencyKey', keySchema);
