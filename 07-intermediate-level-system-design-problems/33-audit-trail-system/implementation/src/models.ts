import { Schema, model } from 'mongoose';

export const Invoice = model(
  'Invoice',
  new Schema({ amount: Number, status: { type: String, default: 'draft' }, note: String }, { versionKey: false }),
);

// Append-only audit log. The app only inserts here (in production: WORM/restricted permissions).
export const AuditLog = model(
  'AuditLog',
  new Schema(
    {
      entityType: String,
      entityId: String,
      action: String,
      actor: String,
      changes: [{ field: String, from: Schema.Types.Mixed, to: Schema.Types.Mixed, _id: false }],
      at: String,
      prevHash: String,
      hash: String,
      seq: Number,
    },
    { versionKey: false },
  ),
);
