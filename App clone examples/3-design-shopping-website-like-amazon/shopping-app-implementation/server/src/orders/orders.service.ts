import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AddressesService } from '../addresses/addresses.service';
import { CartService } from '../cart/cart.service';
import { computeTotals } from '../common/totals';
import { Order } from './order.schema';

export interface OrderView {
  id: string;
  items: unknown[];
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  address: Record<string, unknown>;
  status: string;
  createdAt: string;
}

const view = (o: Record<string, unknown> & { _id: unknown }): OrderView => ({
  id: String(o._id),
  items: (o.items as unknown[]) ?? [],
  subtotalCents: o.subtotalCents as number,
  shippingCents: o.shippingCents as number,
  taxCents: o.taxCents as number,
  totalCents: o.totalCents as number,
  address: (o.address as Record<string, unknown>) ?? {},
  status: o.status as string,
  createdAt: (o.createdAt as Date)?.toISOString?.() ?? '',
});

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly model: Model<Order>,
    private readonly cart: CartService,
    private readonly addresses: AddressesService,
  ) {}

  /**
   * Idempotent checkout: repeated calls with the same key return the same order.
   * Totals are recomputed server-side from the live cart (never trusted from the client),
   * an immutable order is written, and the cart is cleared. Payment is mocked here.
   */
  async checkout(userId: string, addressId: string, idempotencyKey: string): Promise<OrderView> {
    const existing = await this.model.findOne({ userId, idempotencyKey }).lean().exec();
    if (existing) return view(existing as never);

    const cart = await this.cart.get(userId);
    if (cart.items.length === 0) throw new BadRequestException('Your cart is empty');

    const address = await this.addresses.getOwned(userId, addressId); // 404 if not owned
    const totals = computeTotals(cart.items);

    try {
      const order = await this.model.create({
        userId,
        idempotencyKey,
        items: cart.items,
        ...totals,
        address: address as unknown as Record<string, unknown>,
        status: 'paid', // payment mocked as captured
      });
      await this.cart.clear(userId);
      return view(order.toObject() as never);
    } catch (err) {
      // Unique-key race: another request with the same idempotencyKey won → return it.
      if ((err as { code?: number }).code === 11000) {
        const dup = await this.model.findOne({ userId, idempotencyKey }).lean().exec();
        if (dup) return view(dup as never);
      }
      throw err;
    }
  }

  async list(userId: string): Promise<OrderView[]> {
    const rows = await this.model.find({ userId }).sort({ createdAt: -1 }).lean().exec();
    return rows.map((r) => view(r as never));
  }

  async get(userId: string, id: string): Promise<OrderView> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Order not found');
    const row = await this.model.findOne({ _id: id, userId }).lean().exec();
    if (!row) throw new NotFoundException('Order not found');
    return view(row as never);
  }
}
