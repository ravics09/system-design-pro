import { Schema, model } from 'mongoose';

const contentSchema = new Schema(
  {
    title: { type: String, required: true },
    body: { type: String, default: '' },
    status: { type: String, default: 'draft' },
    publishAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },
    history: {
      type: [{ from: String, to: String, action: String, by: String, at: Date }],
      default: [],
    },
  },
  { versionKey: false, optimisticConcurrency: true }, // __v guards concurrent transitions
);

export const Content = model('Content', contentSchema);
