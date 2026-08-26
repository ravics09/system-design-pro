/** Mirrors the NestJS API contract. */
export interface Product {
  id: string;
  name: string;
  priceCents: number;
  currency: string;
  stock: number;
}

export interface CartLine {
  productId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  inStock: boolean;
}

export interface Cart {
  ownerKey: string;
  items: CartLine[];
  totalCents: number;
  currency: string;
  version: number;
}

export interface Order {
  id: string;
  ownerKey: string;
  lines: { productId: string; name: string; unitPriceCents: number; quantity: number }[];
  totalCents: number;
  createdAt: string;
}
