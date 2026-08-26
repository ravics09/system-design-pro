import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CartDocument = HydratedDocument<Cart>;

@Schema({ _id: false })
export class CartItem {
  @Prop({ required: true })
  productId: string;

  @Prop({ required: true, min: 1 })
  quantity: number;
}
const CartItemSchema = SchemaFactory.createForClass(CartItem);

/**
 * One cart per owner. `ownerKey` is "user:<id>" for logged-in users or
 * "guest:<sessionId>" for anonymous carts. Items store only productId +
 * quantity — NEVER a price (recomputed server-side). `version` supports
 * optimistic concurrency for whole-cart writes.
 */
@Schema({ timestamps: true, collection: 'carts' })
export class Cart {
  @Prop({ required: true, unique: true, index: true })
  ownerKey: string;

  @Prop({ type: [CartItemSchema], default: [] })
  items: CartItem[];

  @Prop({ default: 0 })
  version: number;
}

export const CartSchema = SchemaFactory.createForClass(Cart);
