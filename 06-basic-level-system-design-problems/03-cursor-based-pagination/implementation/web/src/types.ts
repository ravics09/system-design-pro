/** Mirrors the NestJS API response contract. */
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

/** Raw API payload for GET /items. */
export interface ApiPage {
  data: ItemView[];
  pageInfo: PageInfo;
}

/** Accumulated client-side cache: all pages merged into one growing list. */
export interface FeedCache {
  items: ItemView[];
  pageInfo: PageInfo;
}
