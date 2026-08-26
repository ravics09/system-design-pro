import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Cart, Order, Product } from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3005";
const OWNER_KEY = process.env.NEXT_PUBLIC_OWNER_KEY ?? "guest:demo-session";

/**
 * RTK Query slice for the storefront. Cart mutations invalidate the `Cart` tag
 * so the cart re-fetches with fresh SERVER-COMPUTED totals — the client never
 * computes prices itself.
 */
export const cartApi = createApi({
  reducerPath: "cartApi",
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL }),
  tagTypes: ["Cart", "Products"],
  endpoints: (builder) => ({
    getProducts: builder.query<Product[], void>({
      query: () => "/products",
      providesTags: ["Products"],
    }),
    getCart: builder.query<Cart, void>({
      query: () => `/carts/${encodeURIComponent(OWNER_KEY)}`,
      providesTags: ["Cart"],
    }),
    addItem: builder.mutation<Cart, { productId: string; quantity?: number }>({
      query: ({ productId, quantity = 1 }) => ({
        url: `/carts/${encodeURIComponent(OWNER_KEY)}/items`,
        method: "POST",
        body: { productId, quantity },
      }),
      invalidatesTags: ["Cart"],
    }),
    setQty: builder.mutation<Cart, { productId: string; quantity: number }>({
      query: ({ productId, quantity }) => ({
        url: `/carts/${encodeURIComponent(OWNER_KEY)}/items/${productId}`,
        method: "PATCH",
        body: { quantity },
      }),
      invalidatesTags: ["Cart"],
    }),
    removeItem: builder.mutation<Cart, string>({
      query: (productId) => ({
        url: `/carts/${encodeURIComponent(OWNER_KEY)}/items/${productId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Cart"],
    }),
    checkout: builder.mutation<Order, { idempotencyKey: string }>({
      query: (body) => ({
        url: `/carts/${encodeURIComponent(OWNER_KEY)}/checkout`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Cart", "Products"],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetCartQuery,
  useAddItemMutation,
  useSetQtyMutation,
  useRemoveItemMutation,
  useCheckoutMutation,
} = cartApi;
