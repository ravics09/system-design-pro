import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProfileDocument = HydratedDocument<Profile>;

/** A viewing profile under an account (up to MAX_PROFILES). Personalization keys on this. */
@Schema({ timestamps: true, collection: 'profiles' })
export class Profile {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: 'red' })
  avatar: string;

  @Prop({ default: false })
  isKids: boolean;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
