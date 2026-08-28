/** The one success/error envelope every response uses. */
export interface PageInfo {
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
}

export interface Meta {
  requestId: string;
  timestamp: string;
  version: string;
  pagination?: PageInfo;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta: Meta;
}

export interface ApiError {
  success: false;
  error: { code: string; message: string; details?: unknown };
  meta: Meta;
}

/**
 * A marker a controller can return to have the interceptor lift `items` into
 * `data` and `pageInfo` into `meta.pagination` — keeping the envelope uniform
 * for both single items and lists.
 */
export class Paginated<T> {
  constructor(
    public readonly items: T[],
    public readonly pageInfo: PageInfo,
  ) {}
}

/** Parse the API version out of a `/api/vN/...` URL, else the default. */
export function versionFromUrl(url: string, fallback: string): string {
  const m = /\/v(\d+)(?:\/|$|\?)/.exec(url);
  return m?.[1] ?? fallback;
}
