import { Schema, model } from 'mongoose';

const pageSchema = new Schema(
  {
    url: { type: String, unique: true },
    status: Number,
    title: String,
    bytes: Number,
    outLinks: Number,
    fetchedAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

export const Page = model('Page', pageSchema);
