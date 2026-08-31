import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RatingDocument = HydratedDocument<Rating>;

/** A thumbs up/down per (profile, title) — a signal for recommendations. */
@Schema({ timestamps: true, collection: 'ratings' })
export class Rating {
  @Prop({ required: true, index: true })
  profileId: string;

  @Prop({ required: true })
  imdbID: string;

  @Prop({ required: true, enum: ['up', 'down'] })
  value: 'up' | 'down';
}

export const RatingSchema = SchemaFactory.createForClass(Rating);
RatingSchema.index({ profileId: 1, imdbID: 1 }, { unique: true });
