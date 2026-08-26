import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

/**
 * A per-user notification record (fan-out-on-write). `dedupeKey` + a unique
 * sparse index give at-least-once delivery WITHOUT duplicate rows: re-emitting
 * the same logical notification for a user is a no-op.
 */
@Schema({ timestamps: true, collection: 'notifications' })
export class Notification {
  @Prop({ required: true, index: true })
  userId: string; // recipient

  @Prop({ required: true })
  type: string; // LIKE | COMMENT | FOLLOW | SYSTEM ...

  @Prop({ type: String, default: null })
  actorId: string | null; // who triggered it

  @Prop({ type: String, default: null })
  entityId: string | null; // the post/comment/etc.

  @Prop({ type: Object, default: {} })
  payload: Record<string, unknown>;

  @Prop({ type: String, default: null })
  dedupeKey: string | null; // idempotency key

  @Prop({ default: false })
  read: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Feed query + cursor pagination, newest-first.
NotificationSchema.index({ userId: 1, createdAt: -1, _id: -1 });
// Idempotent fan-out: at most one row per (user, dedupeKey).
NotificationSchema.index({ userId: 1, dedupeKey: 1 }, { unique: true, sparse: true });
