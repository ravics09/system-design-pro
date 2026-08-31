import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { clearAuth, setCredentials } from './authSlice';
import type {
  Address,
  AuthResult,
  CartView,
  Category,
  CreateAddressInput,
  Order,
  ProductDetail,
  ProductList,
  ProductQueryArgs,
  WishlistItem,
} from '../types';
import type { RootState } from './store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3021';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const { accessToken } = (getState() as RootState).auth;
    if (accessToken) headers.set('authorization', `Bearer ${accessToken}`);
    return headers;
  },
});

/** Attach the access token; on a 401, transparently refresh once and retry. */
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status === 401) {
    const refreshToken = (api.getState() as RootState).auth.refreshToken;
    if (refreshToken) {
      const refresh = await rawBaseQuery(
        { url: '/api/auth/refresh', method: 'POST', body: { refreshToken } },
        api,
        extraOptions,
      );
      if (refresh.data) {
        api.dispatch(setCredentials(refresh.data as AuthResult));
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        api.dispatch(clearAuth());
      }
    }
  }
  return result;
};

function buildProductQuery(args: ProductQueryArgs): string {
  const p = new URLSearchParams();
  if (args.page) p.set('page', String(args.page));
  if (args.perPage) p.set('perPage', String(args.perPage));
  if (args.search) p.set('search', args.search);
  if (args.category) p.set('category', args.category);
  if (args.sort) p.set('sort', args.sort);
  const qs = p.toString();
  return `/api/catalog/products${qs ? `?${qs}` : ''}`;
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Cart', 'Wishlist', 'Addresses', 'Orders'],
  endpoints: (builder) => ({
    // ── auth ──
    register: builder.mutation<AuthResult, { email: string; password: string }>({
      query: (body) => ({ url: '/api/auth/register', method: 'POST', body }),
    }),
    login: builder.mutation<AuthResult, { email: string; password: string }>({
      query: (body) => ({ url: '/api/auth/login', method: 'POST', body }),
    }),
    logout: builder.mutation<{ ok: boolean }, string>({
      query: (refreshToken) => ({ url: '/api/auth/logout', method: 'POST', body: { refreshToken } }),
    }),

    // ── catalog (WooCommerce) ──
    products: builder.query<ProductList, ProductQueryArgs>({
      query: (args) => buildProductQuery(args),
    }),
    categories: builder.query<Category[], void>({ query: () => '/api/catalog/categories' }),
    product: builder.query<ProductDetail, number>({ query: (id) => `/api/catalog/products/${id}` }),

    // ── cart ──
    getCart: builder.query<CartView, void>({ query: () => '/api/cart', providesTags: ['Cart'] }),
    addToCart: builder.mutation<
      CartView,
      { productId: number; name: string; priceCents: number; image?: string | null; qty?: number }
    >({
      query: (body) => ({ url: '/api/cart/items', method: 'POST', body }),
      invalidatesTags: ['Cart'],
    }),
    setCartQty: builder.mutation<CartView, { productId: number; qty: number }>({
      query: ({ productId, qty }) => ({ url: `/api/cart/items/${productId}`, method: 'PATCH', body: { qty } }),
      invalidatesTags: ['Cart'],
    }),
    removeFromCart: builder.mutation<CartView, number>({
      query: (productId) => ({ url: `/api/cart/items/${productId}`, method: 'DELETE' }),
      invalidatesTags: ['Cart'],
    }),
    clearCart: builder.mutation<CartView, void>({
      query: () => ({ url: '/api/cart', method: 'DELETE' }),
      invalidatesTags: ['Cart'],
    }),

    // ── wishlist ──
    getWishlist: builder.query<WishlistItem[], void>({ query: () => '/api/wishlist', providesTags: ['Wishlist'] }),
    addToWishlist: builder.mutation<
      { ok: boolean },
      { productId: number; name: string; priceCents: number; image?: string | null }
    >({
      query: (body) => ({ url: '/api/wishlist', method: 'POST', body }),
      invalidatesTags: ['Wishlist'],
    }),
    removeFromWishlist: builder.mutation<{ ok: boolean }, number>({
      query: (productId) => ({ url: `/api/wishlist/${productId}`, method: 'DELETE' }),
      invalidatesTags: ['Wishlist'],
    }),

    // ── addresses ──
    getAddresses: builder.query<Address[], void>({ query: () => '/api/addresses', providesTags: ['Addresses'] }),
    createAddress: builder.mutation<Address, CreateAddressInput>({
      query: (body) => ({ url: '/api/addresses', method: 'POST', body }),
      invalidatesTags: ['Addresses'],
    }),
    deleteAddress: builder.mutation<{ ok: boolean }, string>({
      query: (id) => ({ url: `/api/addresses/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Addresses'],
    }),

    // ── orders ──
    getOrders: builder.query<Order[], void>({ query: () => '/api/orders', providesTags: ['Orders'] }),
    getOrder: builder.query<Order, string>({ query: (id) => `/api/orders/${id}` }),
    checkout: builder.mutation<Order, { addressId: string; idempotencyKey: string }>({
      query: ({ addressId, idempotencyKey }) => ({
        url: '/api/orders/checkout',
        method: 'POST',
        headers: { 'idempotency-key': idempotencyKey },
        body: { addressId },
      }),
      invalidatesTags: ['Cart', 'Orders'],
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useProductsQuery,
  useCategoriesQuery,
  useProductQuery,
  useGetCartQuery,
  useAddToCartMutation,
  useSetCartQtyMutation,
  useRemoveFromCartMutation,
  useClearCartMutation,
  useGetWishlistQuery,
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
  useGetAddressesQuery,
  useCreateAddressMutation,
  useDeleteAddressMutation,
  useGetOrdersQuery,
  useGetOrderQuery,
  useCheckoutMutation,
} = api;
