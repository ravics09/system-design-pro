import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WishlistItem } from './wishlist.schema';
import type { AddWishlistInput } from './wishlist.dto';

export interface WishlistView {
  productId: number;
  name: string;
  priceCents: number;
  image: string | null;
}

@Injectable()
export class WishlistService {
  constructor(@InjectModel(WishlistItem.name) private readonly model: Model<WishlistItem>) {}

  async list(userId: string): Promise<WishlistView[]> {
    const rows = await this.model.find({ userId }).sort({ createdAt: -1 }).lean().exec();
    return rows.map((r) => ({ productId: r.productId, name: r.name, priceCents: r.priceCents, image: r.image ?? null }));
  }

  async add(userId: string, input: AddWishlistInput): Promise<{ ok: true }> {
    await this.model.updateOne(
      { userId, productId: input.productId },
      { $set: { name: input.name, priceCents: input.priceCents, image: input.image ?? null } },
      { upsert: true },
    ).exec();
    return { ok: true };
  }

  async remove(userId: string, productId: number): Promise<{ ok: true }> {
    await this.model.deleteOne({ userId, productId }).exec();
    return { ok: true };
  }
}
