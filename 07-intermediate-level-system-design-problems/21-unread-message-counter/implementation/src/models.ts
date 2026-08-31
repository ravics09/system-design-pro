import { Schema, model } from 'mongoose';

// Durable per-(user,conversation) read watermark — the source of truth for multi-device reads
// and for reconciling drifted Redis counters.
const membershipSchema = new Schema(
  {
    userId: { type: String, required: true },
    conversationId: { type: String, required: true },
    lastReadMessageId: { type: String, default: null },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);
membershipSchema.index({ userId: 1, conversationId: 1 }, { unique: true });

export const Membership = model('Membership', membershipSchema);
