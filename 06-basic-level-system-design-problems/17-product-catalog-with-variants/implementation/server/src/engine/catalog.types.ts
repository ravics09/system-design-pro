import { z } from 'zod';

/** An option dimension (e.g. Size) and its allowed values (S, M, L). */
export interface OptionType {
  name: string;
  values: string[];
}

/** A concrete, sellable combination — one value per option type. Price is in cents. */
export interface Variant {
  sku: string;
  productId: string;
  options: Record<string, string>;
  price: number; // integer minor units (cents)
  stock: number;
}

export interface Product {
  id: string;
  title: string;
  brand: string;
  basePrice: number; // cents; the starting price for generated variants
  optionTypes: OptionType[];
  createdAt: number;
}

/** Product joined with its variants + a derived catalog summary. */
export interface ProductDetail extends Product {
  variants: Variant[];
  priceRange: { min: number; max: number };
  inStock: number; // number of variants with stock > 0
}

export interface CatalogItem {
  id: string;
  title: string;
  brand: string;
  optionTypes: OptionType[];
  variantCount: number;
  priceRange: { min: number; max: number };
  inStock: number;
}

// ── validation ────────────────────────────────────────────────────────────────
export const optionTypeSchema = z.object({
  name: z.string().min(1).max(40),
  values: z.array(z.string().min(1).max(40)).min(1).max(50),
});

export const createProductSchema = z.object({
  title: z.string().min(1).max(120),
  brand: z.string().min(1).max(80).default('Generic'),
  basePrice: z.coerce.number().int().nonnegative().max(100_000_00), // cents
  optionTypes: z.array(optionTypeSchema).min(1).max(5),
});
export type CreateProductInput = z.infer<typeof createProductSchema>;

export const resolveSchema = z.object({
  selection: z.record(z.string()),
});
export type ResolveInput = z.infer<typeof resolveSchema>;

export const updateVariantSchema = z
  .object({
    price: z.coerce.number().int().nonnegative().max(100_000_00).optional(),
    stock: z.coerce.number().int().nonnegative().max(1_000_000).optional(),
  })
  .refine((v) => v.price !== undefined || v.stock !== undefined, { message: 'price or stock required' });
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;

export const adjustStockSchema = z.object({ delta: z.coerce.number().int() });
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
