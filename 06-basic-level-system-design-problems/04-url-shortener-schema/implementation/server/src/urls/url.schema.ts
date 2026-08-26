import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UrlDocument = HydratedDocument<Url>;

/**
 * The core mapping. `code` is unique (enforced by the DB, not app logic) so
 * custom-alias collisions fail atomically. `expiresAt` drives a TTL index so
 * MongoDB reclaims expired documents automatically; the redirect path also
 * checks it at read time to return a correct 410.
 */
@Schema({ timestamps: true, collection: 'urls' })
export class Url {
  @Prop({ required: true, unique: true, index: true })
  code: string;

  @Prop({ required: true })
  longUrl: string;

  @Prop({ type: String, default: null })
  ownerId: string | null;

  @Prop({ default: false })
  disabled: boolean;

  @Prop({ default: 0 })
  clicks: number;

  @Prop({ type: Date, default: null })
  expiresAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export const UrlSchema = SchemaFactory.createForClass(Url);

// TTL index: Mongo removes the doc once `expiresAt` passes (null = never expires).
UrlSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// List a user's links newest-first.
UrlSchema.index({ ownerId: 1, createdAt: -1 });
