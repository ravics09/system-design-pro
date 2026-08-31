import { Schema, model } from 'mongoose';

/**
 * `optimisticConcurrency: true` makes `.save()` add a `WHERE __v = <loaded>` predicate and bump
 * __v — so a stale save (someone else wrote first) throws a VersionError instead of silently
 * clobbering the other writer's change (the lost-update problem).
 */
const itemSchema = new Schema(
  {
    sku: { type: String, unique: true, required: true },
    qty: { type: Number, default: 0 },
  },
  { optimisticConcurrency: true, timestamps: true },
);

export const Item = model('Item', itemSchema);
