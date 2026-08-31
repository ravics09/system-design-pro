import { Schema, model } from 'mongoose';

const productSchema = new Schema(
  {
    name: String,
    category: { type: String, index: true },
    priceCents: Number,
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

export const Product = model('Product', productSchema);
