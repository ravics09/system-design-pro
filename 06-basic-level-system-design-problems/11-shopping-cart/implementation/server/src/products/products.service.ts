import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product } from './product.schema';

export interface ProductView {
  id: string;
  name: string;
  priceCents: number;
  currency: string;
  stock: number;
}

@Injectable()
export class ProductsService {
  constructor(@InjectModel(Product.name) private readonly model: Model<Product>) {}

  async list(): Promise<ProductView[]> {
    const rows = await this.model.find().sort({ name: 1 }).lean().exec();
    return rows.map((p) => toView(p as unknown as ProductRow));
  }

  /** Fetch a set of products by id, returned as a Map for O(1) lookup. */
  async mapByIds(ids: string[]): Promise<Map<string, ProductRow>> {
    const objectIds = ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
    const rows = (await this.model.find({ _id: { $in: objectIds } }).lean().exec()) as unknown as ProductRow[];
    return new Map(rows.map((p) => [String(p._id), p]));
  }

  /** Dev helper: reset the catalog with a few products (with stock). */
  async seed(): Promise<{ inserted: number }> {
    await this.model.deleteMany({});
    const docs = await this.model.insertMany([
      { name: 'Mechanical Keyboard', priceCents: 8900, currency: 'USD', stock: 25 },
      { name: 'Wireless Mouse', priceCents: 3500, currency: 'USD', stock: 40 },
      { name: '27" Monitor', priceCents: 24900, currency: 'USD', stock: 10 },
      { name: 'USB-C Hub', priceCents: 4500, currency: 'USD', stock: 5 },
      { name: 'Laptop Stand', priceCents: 2900, currency: 'USD', stock: 100 },
    ]);
    return { inserted: docs.length };
  }
}

export interface ProductRow {
  _id: Types.ObjectId;
  name: string;
  priceCents: number;
  currency: string;
  stock: number;
}

function toView(p: ProductRow): ProductView {
  return {
    id: String(p._id),
    name: p.name,
    priceCents: p.priceCents,
    currency: p.currency,
    stock: p.stock,
  };
}
