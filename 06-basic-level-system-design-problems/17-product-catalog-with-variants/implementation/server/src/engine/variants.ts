import type { OptionType, Variant } from './catalog.types';

/** How many variants a set of option types would generate (∏ of value counts). */
export function variantCount(optionTypes: OptionType[]): number {
  return optionTypes.reduce((n, t) => n * t.values.length, 1);
}

/**
 * Cartesian product of the option values → one combination per variant.
 * Size {S,M,L} × Color {Blue,Red} → 6 combinations.
 */
export function cartesian(optionTypes: OptionType[]): Record<string, string>[] {
  let combos: Record<string, string>[] = [{}];
  for (const type of optionTypes) {
    const next: Record<string, string>[] = [];
    for (const combo of combos) {
      for (const value of type.values) {
        next.push({ ...combo, [type.name]: value });
      }
    }
    combos = next;
  }
  return combos;
}

/** Build a human-ish, unique SKU code from the product + a combination. */
export function skuCode(title: string, combo: Record<string, string>): string {
  const slug = title
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')
    .slice(0, 6);
  const suffix = Object.values(combo)
    .map((v) => v.toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 3))
    .join('-');
  return suffix ? `${slug}-${suffix}` : slug;
}

/**
 * Normalize an option selection into a stable key (sorted `type=value` pairs) so a
 * customer's selection can be resolved to exactly one variant in O(1).
 */
export function selectionKey(options: Record<string, string>): string {
  return Object.keys(options)
    .sort()
    .map((k) => `${k}=${options[k]}`)
    .join('|');
}

/** Generate the full variant set for a product's option types. */
export function generateVariants(
  productId: string,
  title: string,
  basePrice: number,
  optionTypes: OptionType[],
): Variant[] {
  return cartesian(optionTypes).map((combo) => ({
    sku: skuCode(title, combo),
    productId,
    options: combo,
    price: basePrice,
    stock: 0,
  }));
}
