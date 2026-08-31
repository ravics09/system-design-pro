import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WishlistItemDocument = HydratedDocument<WishlistItem>;

/** Save-for-later entry, unique per (user, product). */
@Schema({ timestamps: true, collection: 'wishlist' })
export class WishlistItem {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  productId: number;

  @Prop({ required: true })
  name: string;

  @Prop({ default: 0 })
  priceCents: number;

  @Prop({ default: null })
  image: string | null;
}

export const WishlistItemSchema = SchemaFactory.createForClass(WishlistItem);
WishlistItemSchema.index({ userId: 1, productId: 1 }, { unique: true });
