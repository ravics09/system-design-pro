import { Schema, model } from 'mongoose';

const logSchema = new Schema(
  {
    ts: { type: Date, default: Date.now },
    level: String,
    service: String,
    traceId: { type: String, default: null },
    message: String,
    fields: { type: Object, default: {} },
  },
  { versionKey: false },
);

// Common query shapes: by time, by service+level+time, and by trace correlation.
logSchema.index({ ts: -1 });
logSchema.index({ service: 1, level: 1, ts: -1 });
logSchema.index({ traceId: 1, ts: 1 });

export const Log = model('Log', logSchema);
