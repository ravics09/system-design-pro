import { randomUUID } from 'node:crypto';
import type {
  CatalogItem,
  CreateProductInput,
  Product,
  ProductDetail,
  Variant,
} from './catalog.types';
import { generateVariants, selectionKey, variantCount } from './variants';

export class TooManyVariantsError extends Error {
  constructor(count: number, max: number) {
    super(`This option set would generate ${count} variants, exceeding MAX_VARIANTS=${max}`);
    this.name = 'TooManyVariantsError';
  }
}
export class InsufficientStockError extends Error {
  constructor(sku: string, stock: number, delta: number) {
    super(`Cannot adjust ${sku} by ${delta}: stock ${stock} would go negative (oversell)`);
    this.name = 'InsufficientStockError';
  }
}

/**
 * In-memory catalog: products (shared attributes + option types) and their variants
 * (per-SKU price + stock). A per-product selection index maps a normalized option
 * selection to a SKU for O(1) resolution.
 */
export class CatalogEngine {
  private products = new Map<string, Product>();
  private variants = new Map<string, Variant>(); // sku → variant
  private productSkus = new Map<string, string[]>(); // productId → sku[]
  private selectionIndex = new Map<string, Map<string, string>>(); // productId → (selectionKey → sku)

  constructor(private readonly maxVariants: number) {
    this.seed();
  }

  private uniqueSku(base: string): string {
    if (!this.variants.has(base)) return base;
    let n = 2;
    while (this.variants.has(`${base}-${n}`)) n++;
    return `${base}-${n}`;
  }

  createProduct(input: CreateProductInput): ProductDetail {
    const count = variantCount(input.optionTypes);
    if (count > this.maxVariants) throw new TooManyVariantsError(count, this.maxVariants);

    const id = `prod_${randomUUID().slice(0, 8)}`;
    const product: Product = {
      id,
      title: input.title,
      brand: input.brand,
      basePrice: input.basePrice,
      optionTypes: input.optionTypes,
      createdAt: Date.now(),
    };
    this.products.set(id, product);

    const generated = generateVariants(id, input.title, input.basePrice, input.optionTypes);
    const skus: string[] = [];
    const idx = new Map<string, string>();
    for (const v of generated) {
      v.sku = this.uniqueSku(v.sku);
      this.variants.set(v.sku, v);
      skus.push(v.sku);
      idx.set(selectionKey(v.options), v.sku);
    }
    this.productSkus.set(id, skus);
    this.selectionIndex.set(id, idx);
    return this.detail(id)!;
  }

  private variantsOf(productId: string): Variant[] {
    return (this.productSkus.get(productId) ?? []).map((sku) => this.variants.get(sku)!);
  }

  private detail(id: string): ProductDetail | null {
    const product = this.products.get(id);
    if (!product) return null;
    const variants = this.variantsOf(id);
    const prices = variants.map((v) => v.price);
    return {
      ...product,
      variants,
      priceRange: { min: Math.min(...prices), max: Math.max(...prices) },
      inStock: variants.filter((v) => v.stock > 0).length,
    };
  }

  get(id: string): ProductDetail | null {
    return this.detail(id);
  }

  list(): CatalogItem[] {
    return [...this.products.values()].map((p) => {
      const variants = this.variantsOf(p.id);
      const prices = variants.map((v) => v.price);
      return {
        id: p.id,
        title: p.title,
        brand: p.brand,
        optionTypes: p.optionTypes,
        variantCount: variants.length,
        priceRange: { min: Math.min(...prices), max: Math.max(...prices) },
        inStock: variants.filter((v) => v.stock > 0).length,
      };
    });
  }

  /** Resolve a customer's option selection (e.g. {Size:'M',Color:'Blue'}) to one variant. */
  resolve(productId: string, selection: Record<string, string>): Variant | null {
    const idx = this.selectionIndex.get(productId);
    if (!idx) return null;
    const sku = idx.get(selectionKey(selection));
    return sku ? (this.variants.get(sku) ?? null) : null;
  }

  updateVariant(sku: string, patch: { price?: number; stock?: number }): Variant | null {
    const v = this.variants.get(sku);
    if (!v) return null;
    if (patch.price !== undefined) v.price = patch.price;
    if (patch.stock !== undefined) v.stock = patch.stock;
    return v;
  }

  /** Atomic stock change; refuses to go negative (prevents overselling). */
  adjustStock(sku: string, delta: number): Variant | null {
    const v = this.variants.get(sku);
    if (!v) return null;
    const next = v.stock + delta;
    if (next < 0) throw new InsufficientStockError(sku, v.stock, delta);
    v.stock = next;
    return v;
  }

  /** Products that offer a given option value (e.g. all products available in "Red"). */
  filterByOption(typeName: string, value: string): CatalogItem[] {
    return this.list().filter((item) =>
      item.optionTypes.some((t) => t.name === typeName && t.values.includes(value)),
    );
  }

  stats(): { products: number; variants: number } {
    return { products: this.products.size, variants: this.variants.size };
  }

  reset(): void {
    this.products.clear();
    this.variants.clear();
    this.productSkus.clear();
    this.selectionIndex.clear();
    this.seed();
  }

  private seed(): void {
    const tee = this.createProduct({
      title: 'Classic Tee',
      brand: 'Acme',
      basePrice: 1999,
      optionTypes: [
        { name: 'Size', values: ['S', 'M', 'L'] },
        { name: 'Color', values: ['Blue', 'Red'] },
      ],
    });
    // Give the seeded variants some realistic, varied stock (one out of stock).
    tee.variants.forEach((v, i) => {
      this.updateVariant(v.sku, { stock: i === 1 ? 0 : 5 + i * 2, price: v.price + (v.options.Size === 'L' ? 200 : 0) });
    });

    const mug = this.createProduct({
      title: 'Coffee Mug',
      brand: 'Acme',
      basePrice: 1299,
      optionTypes: [{ name: 'Size', values: ['11oz', '15oz'] }],
    });
    mug.variants.forEach((v, i) => this.updateVariant(v.sku, { stock: 20 + i * 5 }));
  }
}
