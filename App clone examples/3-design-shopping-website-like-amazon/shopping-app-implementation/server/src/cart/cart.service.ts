import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { computeTotals, type Totals } from '../common/totals';
import { Cart, type CartItem } from './cart.schema';
import type { AddItemInput } from './cart.dto';

export interface CartView extends Totals {
  items: CartItem[];
  count: number;
}

@Injectable()
export class CartService {
  constructor(@InjectModel(Cart.name) private readonly model: Model<Cart>) {}

  private view(items: CartItem[]): CartView {
    const totals = computeTotals(items);
    return { items, count: items.reduce((n, i) => n + i.qty, 0), ...totals };
  }

  async get(userId: string): Promise<CartView> {
    const cart = await this.model.findOne({ userId }).lean().exec();
    return this.view((cart?.items as CartItem[]) ?? []);
  }

  async addItem(userId: string, input: AddItemInput): Promise<CartView> {
    const cart = await this.model.findOne({ userId }).exec();
    const doc = cart ?? new this.model({ userId, items: [] });
    const existing = doc.items.find((i) => i.productId === input.productId);
    if (existing) {
      existing.qty = Math.min(99, existing.qty + input.qty);
    } else {
      doc.items.push({
        productId: input.productId,
        name: input.name,
        priceCents: input.priceCents,
        image: input.image ?? null,
        qty: input.qty,
      });
    }
    await doc.save();
    return this.view(doc.items);
  }

  async setQty(userId: string, productId: number, qty: number): Promise<CartView> {
    const doc = await this.model.findOne({ userId }).exec();
    if (!doc) return this.view([]);
    if (qty <= 0) {
      doc.items = doc.items.filter((i) => i.productId !== productId);
    } else {
      const item = doc.items.find((i) => i.productId === productId);
      if (item) item.qty = qty;
    }
    await doc.save();
    return this.view(doc.items);
  }

  async removeItem(userId: string, productId: number): Promise<CartView> {
    const doc = await this.model.findOne({ userId }).exec();
    if (!doc) return this.view([]);
    doc.items = doc.items.filter((i) => i.productId !== productId);
    await doc.save();
    return this.view(doc.items);
  }

  async clear(userId: string): Promise<CartView> {
    await this.model.updateOne({ userId }, { $set: { items: [] } }, { upsert: true }).exec();
    return this.view([]);
  }
}
