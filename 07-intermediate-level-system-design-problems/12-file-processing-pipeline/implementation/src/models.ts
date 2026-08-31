import { Schema, model } from 'mongoose';

const jobSchema = new Schema(
  {
    filename: { type: String, required: true },
    sourceHeight: { type: Number, default: 1080 },
    status: { type: String, default: 'queued' }, // queued | processing | ready | failed
    renditions: { type: [Number], default: [] },
    attempts: { type: Number, default: 0 },
    leaseUntil: { type: Date, default: null },
    error: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

export const Job = model('Job', jobSchema);
