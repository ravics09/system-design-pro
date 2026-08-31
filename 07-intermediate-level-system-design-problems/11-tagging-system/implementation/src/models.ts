import { Schema, model } from 'mongoose';

const postSchema = new Schema(
  {
    title: { type: String, required: true },
    body: { type: String, default: '' },
    tags: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

// Multikey index: makes "posts with tag X" and $all/$in tag queries index-backed.
postSchema.index({ tags: 1, _id: -1 });

export const Post = model('Post', postSchema);
