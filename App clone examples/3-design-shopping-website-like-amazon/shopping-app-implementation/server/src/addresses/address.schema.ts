import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AddressDocument = HydratedDocument<Address>;

@Schema({ timestamps: true, collection: 'addresses' })
export class Address {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  line1: string;

  @Prop({ default: '', trim: true })
  line2: string;

  @Prop({ required: true, trim: true })
  city: string;

  @Prop({ default: '', trim: true })
  state: string;

  @Prop({ required: true, trim: true })
  zip: string;

  @Prop({ required: true, trim: true })
  country: string;

  @Prop({ default: '', trim: true })
  phone: string;
}

export const AddressSchema = SchemaFactory.createForClass(Address);
