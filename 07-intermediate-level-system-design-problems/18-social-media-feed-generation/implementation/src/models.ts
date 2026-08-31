import { Schema, model } from 'mongoose';

const postSchema = new Schema(
  {
    postId: { type: String, unique: true },
    authorId: { type: String, index: true },
    text: String,
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

export const Post = model('Post', postSchema);
