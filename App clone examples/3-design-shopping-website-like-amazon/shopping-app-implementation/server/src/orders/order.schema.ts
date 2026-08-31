import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type { CartItem } from '../cart/cart.schema';

export type OrderStatus = 'placed' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
export type OrderDocument = HydratedDocument<Order>;

/** An immutable order snapshot. `idempotencyKey` makes checkout safe to retry. */
@Schema({ timestamps: true, collection: 'orders' })
export class Order {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, unique: true })
  idempotencyKey: string;

  @Prop({
    type: [{ productId: Number, name: String, priceCents: Number, image: String, qty: Number }],
    default: [],
  })
  items: CartItem[];

  @Prop({ required: true })
  subtotalCents: number;

  @Prop({ required: true })
  shippingCents: number;

  @Prop({ required: true })
  taxCents: number;

  @Prop({ required: true })
  totalCents: number;

  @Prop({ type: Object, required: true })
  address: Record<string, unknown>;

  @Prop({ default: 'paid' })
  status: OrderStatus;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
