import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ItemDocument = HydratedDocument<Item>;

/**
 * A minimal "feed item". `createdAt` is the sort key; the document `_id` is the
 * unique tie-breaker. The compound index below is what makes keyset pagination
 * an indexed range scan (O(limit)) rather than a collection scan.
 */
@Schema({ timestamps: true, collection: 'items' })
export class Item {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ default: '' })
  body: string;

  // populated by { timestamps: true }; declared so TypeScript & indexes see it
  createdAt: Date;
  updatedAt: Date;
}

export const ItemSchema = SchemaFactory.createForClass(Item);

// Backs the default "newest first" keyset pagination on (createdAt, _id).
ItemSchema.index({ createdAt: -1, _id: -1 });
