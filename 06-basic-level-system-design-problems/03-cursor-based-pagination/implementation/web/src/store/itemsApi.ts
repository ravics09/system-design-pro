import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { ApiPage, FeedCache } from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

/** Args for a single page request. `cursor` advances the infinite list. */
export interface GetItemsArgs {
  limit: number;
  cursor?: string;
}

/**
 * RTK Query slice implementing INFINITE (cursor) pagination.
 *
 * The trick is to collapse every page of the same query into ONE cache entry and
 * append as pages arrive:
 *   - serializeQueryArgs: drop `cursor` from the cache key → all pages share an entry
 *   - merge:             append the incoming page to the accumulated list (deduped)
 *   - forceRefetch:      actually refetch when the `cursor` changes
 *
 * transformResponse reshapes the API `{ data, pageInfo }` into the accumulated
 * `{ items, pageInfo }` cache shape.
 */
export const itemsApi = createApi({
  reducerPath: "itemsApi",
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL }),
  endpoints: (builder) => ({
    getItems: builder.query<FeedCache, GetItemsArgs>({
      query: ({ limit, cursor }) => {
        const params = new URLSearchParams({ limit: String(limit) });
        if (cursor) params.set("cursor", cursor);
        return `/items?${params.toString()}`;
      },
      transformResponse: (res: ApiPage): FeedCache => ({
        items: res.data,
        pageInfo: res.pageInfo,
      }),
      // Same cache entry for every page of a given limit (ignore the cursor).
      serializeQueryArgs: ({ endpointName, queryArgs }) => `${endpointName}-${queryArgs.limit}`,
      // Append each new page to the growing list; dedupe by id for safety.
      merge: (current, incoming, { arg }) => {
        // A request without a cursor is a fresh first page → replace.
        if (!arg.cursor) {
          current.items = incoming.items;
          current.pageInfo = incoming.pageInfo;
          return;
        }
        const seen = new Set(current.items.map((i) => i.id));
        for (const item of incoming.items) {
          if (!seen.has(item.id)) current.items.push(item);
        }
        current.pageInfo = incoming.pageInfo;
      },
      // Only refetch (and thus append) when the cursor actually changes.
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.cursor !== previousArg?.cursor,
    }),
  }),
});

export const { useGetItemsQuery } = itemsApi;
