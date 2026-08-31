import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { CatalogItem, CreateProductBody, ProductDetail, Variant } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3012';

export const catalogApi = createApi({
  reducerPath: 'catalogApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL }),
  tagTypes: ['Products', 'Product'],
  endpoints: (builder) => ({
    getProducts: builder.query<CatalogItem[], void>({
      query: () => '/products',
      providesTags: ['Products'],
    }),
    getProduct: builder.query<ProductDetail, string>({
      query: (id) => `/products/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Product', id }],
    }),
    resolveVariant: builder.mutation<{ variant: Variant | null }, { id: string; selection: Record<string, string> }>({
      query: ({ id, selection }) => ({ url: `/products/${id}/resolve`, method: 'POST', body: { selection } }),
    }),
    createProduct: builder.mutation<ProductDetail, CreateProductBody>({
      query: (body) => ({ url: '/products', method: 'POST', body }),
      invalidatesTags: ['Products'],
    }),
    updateVariant: builder.mutation<Variant, { sku: string; productId: string; price?: number; stock?: number }>({
      query: ({ sku, price, stock }) => ({ url: `/variants/${sku}`, method: 'PATCH', body: { price, stock } }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'Product', id: arg.productId }, 'Products'],
    }),
    adjustStock: builder.mutation<Variant, { sku: string; productId: string; delta: number }>({
      query: ({ sku, delta }) => ({ url: `/variants/${sku}/adjust`, method: 'POST', body: { delta } }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'Product', id: arg.productId }, 'Products'],
    }),
    reset: builder.mutation<{ ok: boolean }, void>({
      query: () => ({ url: '/reset', method: 'POST' }),
      invalidatesTags: ['Products'],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductQuery,
  useResolveVariantMutation,
  useCreateProductMutation,
  useUpdateVariantMutation,
  useAdjustStockMutation,
  useResetMutation,
} = catalogApi;
