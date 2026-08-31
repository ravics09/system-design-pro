import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SessionDocument = HydratedDocument<Session>;

/**
 * A refresh-token session. The token itself is stored only as a SHA-256 hash (never
 * plaintext). Rotated on every refresh; `familyId` groups a login lineage so a detected
 * reuse can revoke the whole family.
 */
@Schema({ timestamps: true, collection: 'sessions' })
export class Session {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  refreshHash: string;

  @Prop({ required: true, index: true })
  familyId: string;

  @Prop({ default: false })
  revoked: boolean;

  @Prop({ required: true })
  expiresAt: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
