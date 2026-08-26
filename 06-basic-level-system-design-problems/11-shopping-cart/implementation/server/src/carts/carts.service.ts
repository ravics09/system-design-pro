import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart } from './cart.schema';
import { Order } from './order.schema';
import { Product } from '../products/product.schema';
import { ProductsService } from '../products/products.service';
import type { CartLineView, CartView, OrderView } from './carts.dto';

@Injectable()
export class CartsService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<Cart>,
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    private readonly products: ProductsService,
  ) {}

  /**
   * Add an item (or increment its quantity). The mutation is ATOMIC — an `$inc`
   * on the matched line — so two concurrent "add 1" requests compose to +2 rather
   * than losing an update. If the line is absent, we push it (guarded by `$ne`).
   */
  async addItem(ownerKey: string, productId: string, quantity: number): Promise<CartView> {
    // Ensure the product exists (and isn't a spoofed id).
    const exists = await this.productModel.exists({ _id: productId });
    if (!exists) throw new BadRequestException('Unknown product');

    const inc = await this.cartModel.updateOne(
      { ownerKey, 'items.productId': productId },
      { $inc: { 'items.$.quantity': quantity, version: 1 } },
    );

    if (inc.matchedCount === 0) {
      // No existing line: upsert the cart and push the item (the $ne guard avoids
      // a duplicate line if another request created it concurrently).
      await this.cartModel.updateOne(
        { ownerKey, 'items.productId': { $ne: productId } },
        {
          $push: { items: { productId, quantity } },
          $inc: { version: 1 },
          $setOnInsert: { ownerKey },
        },
        { upsert: true },
      );
    }

    return this.getCart(ownerKey);
  }

  /** Set an absolute quantity (0 removes). Optimistic version bump. */
  async setQty(ownerKey: string, productId: string, quantity: number): Promise<CartView> {
    if (quantity <= 0) return this.removeItem(ownerKey, productId);

    const res = await this.cartModel.updateOne(
      { ownerKey, 'items.productId': productId },
      { $set: { 'items.$.quantity': quantity }, $inc: { version: 1 } },
    );
    if (res.matchedCount === 0) {
      // Item not in cart yet → treat as add.
      return this.addItem(ownerKey, productId, quantity);
    }
    return this.getCart(ownerKey);
  }

  async removeItem(ownerKey: string, productId: string): Promise<CartView> {
    await this.cartModel.updateOne(
      { ownerKey },
      { $pull: { items: { productId } }, $inc: { version: 1 } },
    );
    return this.getCart(ownerKey);
  }

  /**
   * Read the cart with SERVER-COMPUTED prices. The cart stores only productId +
   * quantity; prices come from the catalog here, so a client can never spoof them.
   */
  async getCart(ownerKey: string): Promise<CartView> {
    const cart = await this.cartModel.findOne({ ownerKey }).lean().exec();
    if (!cart || cart.items.length === 0) {
      return { ownerKey, items: [], totalCents: 0, currency: 'USD', version: cart?.version ?? 0 };
    }

    const productMap = await this.products.mapByIds(cart.items.map((i) => i.productId));
    const items: CartLineView[] = [];
    let totalCents = 0;
    let currency = 'USD';

    for (const item of cart.items) {
      const product = productMap.get(item.productId);
      if (!product) continue; // product removed from catalog → drop from view
      const lineTotal = product.priceCents * item.quantity;
      totalCents += lineTotal;
      currency = product.currency;
      items.push({
        productId: item.productId,
        name: product.name,
        unitPriceCents: product.priceCents,
        quantity: item.quantity,
        lineTotalCents: lineTotal,
        inStock: product.stock >= item.quantity,
      });
    }

    return { ownerKey, items, totalCents, currency, version: cart.version };
  }

  /**
   * Merge a (guest) cart into another (user) cart by SUMMING quantities per
   * product, then discard the source cart. Reuses the atomic add so quantities
   * combine correctly.
   */
  async merge(toOwnerKey: string, fromOwnerKey: string): Promise<CartView> {
    if (toOwnerKey === fromOwnerKey) return this.getCart(toOwnerKey);
    const from = await this.cartModel.findOne({ ownerKey: fromOwnerKey }).lean().exec();
    if (from && from.items.length > 0) {
      for (const item of from.items) {
        await this.addItem(toOwnerKey, item.productId, item.quantity);
      }
    }
    await this.cartModel.deleteOne({ ownerKey: fromOwnerKey });
    return this.getCart(toOwnerKey);
  }

  /**
   * Checkout: idempotent, oversell-safe.
   *  1. If an order already exists for this idempotency key → return it (no re-charge).
   *  2. Recompute prices server-side.
   *  3. Reserve stock with an ATOMIC CONDITIONAL DECREMENT (`stock >= qty`); on a
   *     partial failure, COMPENSATE by restoring what was already decremented.
   *  4. Create the order (price snapshot) and clear the cart.
   */
  async checkout(ownerKey: string, idempotencyKey?: string): Promise<OrderView> {
    if (idempotencyKey) {
      const existing = await this.orderModel.findOne({ ownerKey, idempotencyKey }).lean().exec();
      if (existing) return toOrderView(existing as unknown as OrderRow);
    }

    const cart = await this.cartModel.findOne({ ownerKey }).lean().exec();
    if (!cart || cart.items.length === 0) throw new BadRequestException('Cart is empty');

    const productMap = await this.products.mapByIds(cart.items.map((i) => i.productId));
    const lines = cart.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) throw new BadRequestException(`Product ${item.productId} no longer exists`);
      return {
        productId: item.productId,
        name: product.name,
        unitPriceCents: product.priceCents,
        quantity: item.quantity,
      };
    });

    // Reserve inventory atomically, tracking what we decrement so we can roll back.
    const decremented: { productId: string; quantity: number }[] = [];
    for (const line of lines) {
      const res = await this.productModel.updateOne(
        { _id: line.productId, stock: { $gte: line.quantity } },
        { $inc: { stock: -line.quantity } },
      );
      if (res.modifiedCount === 1) {
        decremented.push({ productId: line.productId, quantity: line.quantity });
      } else {
        await this.compensate(decremented); // roll back partial reservation
        throw new ConflictException(`Insufficient stock for ${line.name}`);
      }
    }

    const totalCents = lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);

    let order;
    try {
      order = await this.orderModel.create({
        ownerKey,
        lines,
        totalCents,
        idempotencyKey: idempotencyKey ?? null,
      });
    } catch (err) {
      // Concurrent double-submit won the unique key: undo our decrement and return theirs.
      if (isDuplicateKey(err) && idempotencyKey) {
        await this.compensate(decremented);
        const existing = await this.orderModel.findOne({ ownerKey, idempotencyKey }).lean().exec();
        if (existing) return toOrderView(existing as unknown as OrderRow);
      }
      await this.compensate(decremented);
      throw err;
    }

    // Clear the cart (keep the doc, bump version).
    await this.cartModel.updateOne({ ownerKey }, { $set: { items: [] }, $inc: { version: 1 } });

    return toOrderView(order.toObject() as unknown as OrderRow);
  }

  private async compensate(decremented: { productId: string; quantity: number }[]): Promise<void> {
    for (const d of decremented) {
      await this.productModel.updateOne({ _id: d.productId }, { $inc: { stock: d.quantity } });
    }
  }
}

interface OrderRow {
  _id: Types.ObjectId;
  ownerKey: string;
  lines: { productId: string; name: string; unitPriceCents: number; quantity: number }[];
  totalCents: number;
  createdAt: Date;
}

function toOrderView(o: OrderRow): OrderView {
  return {
    id: String(o._id),
    ownerKey: o.ownerKey,
    lines: o.lines,
    totalCents: o.totalCents,
    createdAt: new Date(o.createdAt).toISOString(),
  };
}

function isDuplicateKey(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;
}
