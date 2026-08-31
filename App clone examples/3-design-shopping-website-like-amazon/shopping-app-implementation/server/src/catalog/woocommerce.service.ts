import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { config } from '../config';

export interface ProductCard {
  id: number;
  name: string;
  priceCents: number;
  regularPriceCents: number | null;
  currency: string;
  image: string | null;
  rating: number;
  inStock: boolean;
  categories: { id: number; name: string }[];
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

export interface ProductQuery {
  page?: number;
  perPage?: number;
  search?: string;
  category?: string;
  sort?: 'popularity' | 'rating' | 'date' | 'price' | 'price-desc';
}

/** WooCommerce prices are decimal strings in the store currency → integer minor units. */
export function priceToCents(price: unknown): number {
  const n = typeof price === 'number' ? price : parseFloat(String(price ?? ''));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

interface WooImage { src?: string }
interface WooCategory { id: number; name: string; slug?: string; count?: number }
interface WooProduct {
  id: number;
  name: string;
  price: string;
  regular_price: string;
  images?: WooImage[];
  average_rating?: string;
  stock_status?: string;
  categories?: WooCategory[];
  description?: string;
  short_description?: string;
  permalink?: string;
}

const cardOf = (p: WooProduct): ProductCard => ({
  id: p.id,
  name: p.name,
  priceCents: priceToCents(p.price),
  regularPriceCents: p.regular_price ? priceToCents(p.regular_price) : null,
  currency: config.WC_CURRENCY,
  image: p.images?.[0]?.src ?? null,
  rating: p.average_rating ? parseFloat(p.average_rating) : 0,
  inStock: (p.stock_status ?? 'instock') === 'instock',
  categories: (p.categories ?? []).map((c) => ({ id: c.id, name: c.name })),
});

const SORT_MAP: Record<string, { orderby: string; order: string }> = {
  popularity: { orderby: 'popularity', order: 'desc' },
  rating: { orderby: 'rating', order: 'desc' },
  date: { orderby: 'date', order: 'desc' },
  price: { orderby: 'price', order: 'asc' },
  'price-desc': { orderby: 'price', order: 'desc' },
};

/**
 * WooCommerce REST client with an in-process TTL cache (cache-aside). The catalog is
 * read-mostly, so most listing/detail loads never hit WooCommerce — and we stay within
 * its rate limits. In production this cache is Redis, shared across instances.
 */
@Injectable()
export class WooCommerceService {
  private readonly logger = new Logger(WooCommerceService.name);
  private readonly cache = new Map<string, { value: unknown; expiresAt: number }>();

  get configured(): boolean {
    return !!(config.WC_BASE_URL && config.WC_CONSUMER_KEY && config.WC_CONSUMER_SECRET);
  }

  private authHeader(): string {
    const basic = Buffer.from(`${config.WC_CONSUMER_KEY}:${config.WC_CONSUMER_SECRET}`).toString('base64');
    return `Basic ${basic}`;
  }

  private async cached<T>(key: string, loader: () => Promise<T>): Promise<T> {
    const hit = this.cache.get(key);
    if (hit && hit.expiresAt > Date.now()) return hit.value as T;
    const value = await loader();
    this.cache.set(key, { value, expiresAt: Date.now() + config.CATALOG_CACHE_TTL_MS });
    return value;
  }

  private async woo(path: string, params: Record<string, string> = {}): Promise<{ json: unknown; total: number }> {
    const url = new URL(config.WC_BASE_URL.replace(/\/$/, '') + path);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await fetch(url.toString(), { headers: { Authorization: this.authHeader() } });
    if (!res.ok) throw new Error(`WooCommerce HTTP ${res.status}`);
    const total = Number(res.headers.get('x-wp-total') ?? '0');
    return { json: await res.json(), total };
  }

  async listProducts(q: ProductQuery): Promise<ProductList> {
    const page = Math.max(1, q.page ?? 1);
    const perPage = Math.min(100, q.perPage ?? config.DEFAULT_PER_PAGE);
    if (!this.configured) {
      return { items: [], total: 0, page, perPage, configured: false };
    }
    const key = `products:${page}:${perPage}:${q.search ?? ''}:${q.category ?? ''}:${q.sort ?? ''}`;
    return this.cached(key, async () => {
      try {
        const params: Record<string, string> = { page: String(page), per_page: String(perPage), status: 'publish' };
        if (q.search) params.search = q.search;
        if (q.category) params.category = q.category;
        const sort = q.sort ? SORT_MAP[q.sort] : undefined;
        if (sort) {
          params.orderby = sort.orderby;
          params.order = sort.order;
        }
        const { json, total } = await this.woo('/products', params);
        const items = Array.isArray(json) ? (json as WooProduct[]).map(cardOf) : [];
        return { items, total, page, perPage, configured: true };
      } catch (err) {
        this.logger.warn(`WooCommerce listProducts failed: ${(err as Error).message}`);
        return { items: [], total: 0, page, perPage, configured: true };
      }
    });
  }

  async getProduct(id: number): Promise<ProductDetail> {
    if (!this.configured) throw new NotFoundException('Catalog not configured (missing WooCommerce keys)');
    const detail = await this.cached(`product:${id}`, async () => {
      try {
        const { json } = await this.woo(`/products/${id}`);
        const p = json as WooProduct;
        if (!p || !p.id) return null;
        return {
          ...cardOf(p),
          images: (p.images ?? []).map((i) => i.src).filter((s): s is string => !!s),
          description: p.description ?? '',
          shortDescription: p.short_description ?? '',
          permalink: p.permalink ?? '',
        } as ProductDetail;
      } catch (err) {
        this.logger.warn(`WooCommerce getProduct(${id}) failed: ${(err as Error).message}`);
        return null;
      }
    });
    if (!detail) throw new NotFoundException(`Product ${id} not found`);
    return detail;
  }

  async categories(): Promise<Category[]> {
    if (!this.configured) return [];
    return this.cached('categories', async () => {
      try {
        const { json } = await this.woo('/products/categories', { per_page: '100', orderby: 'count', order: 'desc' });
        const list = Array.isArray(json) ? (json as WooCategory[]) : [];
        return list
          .filter((c) => (c.count ?? 0) > 0)
          .map((c) => ({ id: c.id, name: c.name, slug: c.slug ?? '', count: c.count ?? 0 }));
      } catch (err) {
        this.logger.warn(`WooCommerce categories failed: ${(err as Error).message}`);
        return [];
      }
    });
  }
}
