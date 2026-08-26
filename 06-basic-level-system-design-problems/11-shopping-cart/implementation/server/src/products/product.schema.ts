import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

/**
 * The catalog. `priceCents` is the source of truth for pricing (the cart never
 * stores a price). `stock` is the contended resource protected by an atomic
 * conditional decrement at checkout.
 */
@Schema({ timestamps: true, collection: 'products' })
export class Product {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true })
  priceCents: number;

  @Prop({ default: 'USD' })
  currency: string;

  @Prop({ required: true, default: 0 })
  stock: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
