import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

@Schema({ _id: false })
export class OrderLine {
  @Prop({ required: true }) productId: string;
  @Prop({ required: true }) name: string;
  @Prop({ required: true }) unitPriceCents: number; // snapshot at checkout
  @Prop({ required: true }) quantity: number;
}
const OrderLineSchema = SchemaFactory.createForClass(OrderLine);

/**
 * An order created at checkout with a PRICE SNAPSHOT. The `idempotencyKey` +
 * a unique partial index dedupes double-submits: a retry with the same key
 * returns the existing order instead of decrementing stock / charging twice.
 */
@Schema({ timestamps: true, collection: 'orders' })
export class Order {
  @Prop({ required: true, index: true })
  ownerKey: string;

  @Prop({ type: [OrderLineSchema], default: [] })
  lines: OrderLine[];

  @Prop({ required: true })
  totalCents: number;

  @Prop({ type: String, default: null })
  idempotencyKey: string | null;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Dedupe checkout per owner+key (only when a key is present).
OrderSchema.index(
  { ownerKey: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } },
);
