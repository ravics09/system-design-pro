import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProgressDocument = HydratedDocument<Progress>;

/** Playback progress per (profile, title). Upserted from player heartbeats. */
@Schema({ timestamps: true, collection: 'progress' })
export class Progress {
  @Prop({ required: true, index: true })
  profileId: string;

  @Prop({ required: true })
  imdbID: string;

  @Prop({ required: true })
  title: string;

  @Prop({ default: null })
  poster: string | null;

  @Prop({ default: 0 })
  positionS: number;

  @Prop({ default: 0 })
  durationS: number;
}

export const ProgressSchema = SchemaFactory.createForClass(Progress);
ProgressSchema.index({ profileId: 1, imdbID: 1 }, { unique: true });
