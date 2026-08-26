import { z } from 'zod';
import { Types } from 'mongoose';
import { config } from '../config';

export const objectId = z
  .string()
  .refine((v) => Types.ObjectId.isValid(v), { message: 'Invalid product id' });

/** POST /carts/:ownerKey/items — add (or increment) an item. */
export const addItemSchema = z.object({
  productId: objectId,
  quantity: z.coerce.number().int().positive().max(config.MAX_QTY_PER_ITEM).default(1),
});

/** PATCH /carts/:ownerKey/items/:productId — set an absolute quantity (0 removes). */
export const setQtySchema = z.object({
  quantity: z.coerce.number().int().min(0).max(config.MAX_QTY_PER_ITEM),
});

export const mergeSchema = z.object({
  fromOwnerKey: z.string().min(1).max(128),
});

export const checkoutSchema = z.object({
  idempotencyKey: z.string().min(1).max(128).optional(),
});

export type AddItemInput = z.infer<typeof addItemSchema>;
export type SetQtyInput = z.infer<typeof setQtySchema>;
export type MergeInput = z.infer<typeof mergeSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export interface CartLineView {
  productId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  inStock: boolean;
}
export interface CartView {
  ownerKey: string;
  items: CartLineView[];
  totalCents: number;
  currency: string;
  version: number;
}
export interface OrderView {
  id: string;
  ownerKey: string;
  lines: { productId: string; name: string; unitPriceCents: number; quantity: number }[];
  totalCents: number;
  createdAt: string;
}
