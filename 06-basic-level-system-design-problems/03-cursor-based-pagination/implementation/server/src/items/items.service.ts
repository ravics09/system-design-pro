import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, type FilterQuery } from 'mongoose';
import { Item } from './item.schema';
import type { ItemView, ListQuery, PaginatedItems } from './items.dto';
import { decodeCursor, encodeCursor, keysetFilter } from '../common/cursor';

@Injectable()
export class ItemsService {
  constructor(@InjectModel(Item.name) private readonly itemModel: Model<Item>) {}

  /**
   * Keyset (cursor) pagination, newest-first.
   *
   * 1. If a cursor is supplied, decode it and build the seek filter.
   * 2. Over-fetch one extra row (`limit + 1`) so we know whether a next page
   *    exists without a separate expensive count().
   * 3. Encode the last returned row as the next cursor.
   */
  async list(query: ListQuery): Promise<PaginatedItems> {
    const { limit } = query;

    let filter: FilterQuery<Item> = {};
    if (query.cursor) {
      const cursor = decodeCursor(query.cursor);
      if (!cursor) throw new BadRequestException('Invalid cursor');
      filter = keysetFilter<Item>(cursor);
    }

    const rows = await this.itemModel
      .find(filter)
      .sort({ createdAt: -1, _id: -1 }) // deterministic: sort key + unique tie-breaker
      .limit(limit + 1)
      .lean()
      .exec();

    const hasNextPage = rows.length > limit;
    const pageRows = hasNextPage ? rows.slice(0, limit) : rows;
    const last = pageRows[pageRows.length - 1];

    const nextCursor =
      hasNextPage && last
        ? encodeCursor({ v: new Date(last.createdAt).toISOString(), id: String(last._id) })
        : null;

    return {
      data: pageRows.map(toView),
      pageInfo: { nextCursor, hasNextPage, limit },
    };
  }

  /** Dev helper: wipe and seed N items with distinct, ordered timestamps. */
  async seed(count: number): Promise<{ inserted: number }> {
    await this.itemModel.deleteMany({});
    const base = Date.now();
    const docs = Array.from({ length: count }, (_, i) => ({
      title: `Item ${count - i}`,
      body: `This is the body of item #${count - i}.`,
      // Spread timestamps so ordering is stable and deterministic for demos/tests.
      createdAt: new Date(base - i * 1000),
      updatedAt: new Date(base - i * 1000),
    }));
    await this.itemModel.insertMany(docs);
    return { inserted: docs.length };
  }
}

function toView(row: {
  _id: unknown;
  title: string;
  body: string;
  createdAt: Date;
}): ItemView {
  return {
    id: String(row._id),
    title: row.title,
    body: row.body,
    createdAt: new Date(row.createdAt).toISOString(),
  };
}
