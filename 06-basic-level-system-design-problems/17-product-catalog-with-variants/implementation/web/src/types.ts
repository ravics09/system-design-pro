export interface OptionType {
  name: string;
  values: string[];
}

export interface Variant {
  sku: string;
  productId: string;
  options: Record<string, string>;
  price: number; // cents
  stock: number;
}

export interface PriceRange {
  min: number;
  max: number;
}

export interface CatalogItem {
  id: string;
  title: string;
  brand: string;
  optionTypes: OptionType[];
  variantCount: number;
  priceRange: PriceRange;
  inStock: number;
}

export interface ProductDetail {
  id: string;
  title: string;
  brand: string;
  basePrice: number;
  optionTypes: OptionType[];
  variants: Variant[];
  priceRange: PriceRange;
  inStock: number;
  createdAt: number;
}

export interface CreateProductBody {
  title: string;
  brand: string;
  basePrice: number;
  optionTypes: OptionType[];
}

/** Format cents as a currency string. */
export const money = (cents: number): string => `$${(cents / 100).toFixed(2)}`;
