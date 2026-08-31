import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export interface CartItem {
  productId: number;
  name: string;
  priceCents: number;
  image: string | null;
  qty: number;
}

export type CartDocument = HydratedDocument<Cart>;

/** One cart document per user; items carry display snapshots (re-priced at checkout). */
@Schema({ timestamps: true, collection: 'carts' })
export class Cart {
  @Prop({ required: true, unique: true, index: true })
  userId: string;

  @Prop({
    type: [{ productId: Number, name: String, priceCents: Number, image: String, qty: Number }],
    default: [],
  })
  items: CartItem[];
}

export const CartSchema = SchemaFactory.createForClass(Cart);
