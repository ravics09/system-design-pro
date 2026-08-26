import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CounterDocument = HydratedDocument<Counter>;

/**
 * A named counter. We use a single document per counter name and atomically
 * `$inc` it, which MongoDB guarantees is safe under concurrency — giving a
 * monotonically increasing, collision-free id source for Base62 codes.
 */
@Schema({ collection: 'counters' })
export class Counter {
  @Prop({ required: true })
  _id: string; // counter name, e.g. "url"

  @Prop({ required: true, default: 0 })
  seq: number;
}

export const CounterSchema = SchemaFactory.createForClass(Counter);
