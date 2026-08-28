import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { CacheStats, Item, ItemRead } from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3007";

/**
 * RTK Query slice for the caching demo.
 *
 * `readItem` is a MUTATION (not a query) on purpose: we want every click to hit
 * the server so we can observe the real hit/miss + latency each time, rather than
 * RTK Query's own client-side cache short-circuiting it. It invalidates `Stats`
 * so the metrics panel refreshes after each read.
 */
export const cacheApi = createApi({
  reducerPath: "cacheApi",
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL }),
  tagTypes: ["Stats", "Items"],
  endpoints: (builder) => ({
    getItems: builder.query<Item[], void>({
      query: () => "/items",
      providesTags: ["Items"],
    }),
    getStats: builder.query<CacheStats, void>({
      query: () => "/cache/stats",
      providesTags: ["Stats"],
    }),
    readItem: builder.mutation<ItemRead, string>({
      query: (id) => ({ url: `/items/${id}`, method: "GET" }),
      invalidatesTags: ["Stats"],
    }),
    updateItem: builder.mutation<Item, { id: string; value: number }>({
      query: ({ id, value }) => ({ url: `/items/${id}`, method: "PUT", body: { value } }),
      invalidatesTags: ["Stats", "Items"],
    }),
    flush: builder.mutation<CacheStats, void>({
      query: () => ({ url: "/cache/flush", method: "POST" }),
      invalidatesTags: ["Stats"],
    }),
    seed: builder.mutation<{ count: number }, void>({
      query: () => ({ url: "/items/seed", method: "POST" }),
      invalidatesTags: ["Stats", "Items"],
    }),
  }),
});

export const {
  useGetItemsQuery,
  useGetStatsQuery,
  useReadItemMutation,
  useUpdateItemMutation,
  useFlushMutation,
  useSeedMutation,
} = cacheApi;
