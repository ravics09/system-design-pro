import type { Request } from "express";

/** The principal attached to a request after `authenticate`. */
export interface AuthUser {
  id: string;
}

/** Express request that has passed through the auth middleware. */
export interface AuthedRequest extends Request {
  user?: AuthUser;
}

/** Standard paginated list envelope. */
export interface PageInfo {
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
}

export interface Paginated<T> {
  data: T[];
  pageInfo: PageInfo;
}
