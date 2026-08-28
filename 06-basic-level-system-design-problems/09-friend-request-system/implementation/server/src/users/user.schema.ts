import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

/**
 * A user. We use a human-readable handle as the `_id` (e.g. "alice") so the demo
 * is deterministic and friendship rows can reference stable string ids. In
 * production this would be an ObjectId / UUID from the auth system.
 */
@Schema({ collection: 'users', _id: false })
export class User {
  @Prop({ type: String, required: true })
  _id: string; // handle

  @Prop({ required: true, trim: true })
  name: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
