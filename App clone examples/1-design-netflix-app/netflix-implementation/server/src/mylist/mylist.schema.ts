import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MyListItemDocument = HydratedDocument<MyListItem>;

/** A watchlist entry, unique per (profile, title). */
@Schema({ timestamps: true, collection: 'mylist' })
export class MyListItem {
  @Prop({ required: true, index: true })
  profileId: string;

  @Prop({ required: true })
  imdbID: string;

  @Prop({ required: true })
  title: string;

  @Prop({ default: null })
  poster: string | null;
}

export const MyListItemSchema = SchemaFactory.createForClass(MyListItem);
MyListItemSchema.index({ profileId: 1, imdbID: 1 }, { unique: true });
