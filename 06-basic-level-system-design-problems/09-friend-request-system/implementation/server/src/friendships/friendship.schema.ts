import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FriendshipDocument = HydratedDocument<Friendship>;

export const FRIENDSHIP_STATUSES = ['PENDING', 'ACCEPTED', 'DECLINED', 'BLOCKED'] as const;
export type FriendshipStatus = (typeof FRIENDSHIP_STATUSES)[number];

/**
 * ONE document per pair of users (the single-edge model). `pairKey` is the two
 * ids sorted + joined, with a UNIQUE index — so a pair can never have two rows,
 * even under concurrent requests. Direction is preserved via requesterId /
 * addresseeId (for PENDING, the sender/recipient; for BLOCKED, the blocker/blocked).
 */
@Schema({ timestamps: true, collection: 'friendships' })
export class Friendship {
  @Prop({ required: true })
  requesterId: string;

  @Prop({ required: true })
  addresseeId: string;

  @Prop({ required: true, enum: FRIENDSHIP_STATUSES })
  status: FriendshipStatus;

  @Prop({ required: true, unique: true })
  pairKey: string;
}

export const FriendshipSchema = SchemaFactory.createForClass(Friendship);

// Access paths for "my outgoing/blocked" and "my incoming/friends" queries.
FriendshipSchema.index({ requesterId: 1, status: 1 });
FriendshipSchema.index({ addresseeId: 1, status: 1 });
