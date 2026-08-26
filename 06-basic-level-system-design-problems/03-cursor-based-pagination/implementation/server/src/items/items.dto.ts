import { z } from 'zod';
import { config } from '../config';

/**
 * Query schema for GET /items. `limit` is coerced and CLAMPED to a max so a
 * client cannot request an unbounded page. `cursor` is optional and opaque.
 */
export const listQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(config.MAX_PAGE_SIZE)
    .default(config.DEFAULT_PAGE_SIZE),
  cursor: z.string().min(1).optional(),
});

export type ListQuery = z.infer<typeof listQuerySchema>;

/** Response contract returned to clients. */
export interface ItemView {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

export interface PageInfo {
  nextCursor: string | null;
  hasNextPage: boolean;
  limit: number;
}

export interface PaginatedItems {
  data: ItemView[];
  pageInfo: PageInfo;
}
