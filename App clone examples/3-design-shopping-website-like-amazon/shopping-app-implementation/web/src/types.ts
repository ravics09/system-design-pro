// API contract types — mirror the NestJS server response shapes.

export interface User {
  id: string;
  email: string;
  plan: string;
}

export interface AuthResult {
  accessToken: string;
  accessExpiresAt: number;
  refreshToken: string;
  user: User;
}

export interface ProductCategory {
  id: number;
  name: string;
}

export interface ProductCard {
  id: number;
  name: string;
  priceCents: number;
  regularPriceCents: number | null;
  currency: string;
  image: string | null;
  rating: number;
  inStock: boolean;
  categories: ProductCategory[];
}

export interface ProductDetail extends ProductCard {
  images: string[];
  description: string;
  shortDescription: string;
  permalink: string;
}

export interface ProductList {
  items: ProductCard[];
  total: number;
  page: number;
  perPage: number;
  configured: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface CartItem {
  productId: number;
  name: string;
  priceCents: number;
  image: string | null;
  qty: number;
}

export interface CartView {
  items: CartItem[];
  count: number;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
}

export interface WishlistItem {
  productId: number;
  name: string;
  priceCents: number;
  image: string | null;
}

export interface Address {
  id: string;
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
}

export interface CreateAddressInput {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  zip: string;
  country: string;
  phone?: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  address: Partial<Address>;
  status: string;
  createdAt: string;
}

export type SortOption = 'popularity' | 'rating' | 'date' | 'price' | 'price-desc';

export interface ProductQueryArgs {
  page?: number;
  perPage?: number;
  search?: string;
  category?: string;
  sort?: SortOption;
}
