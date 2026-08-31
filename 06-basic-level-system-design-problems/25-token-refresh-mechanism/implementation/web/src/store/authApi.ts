import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Session } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3015';

export interface CallResult {
  status: number;
  ok: boolean;
  body: unknown;
}
function toResult(body: unknown, meta: { response?: Response } | undefined): CallResult {
  return { status: meta?.response?.status ?? 0, ok: meta?.response?.ok ?? false, body };
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL }),
  tagTypes: ['Sessions'],
  endpoints: (builder) => ({
    login: builder.mutation<CallResult, { username: string; password: string }>({
      query: (body) => ({ url: '/login', method: 'POST', body, validateStatus: () => true }),
      transformResponse: toResult,
      invalidatesTags: ['Sessions'],
    }),
    refresh: builder.mutation<CallResult, string>({
      query: (refreshToken) => ({ url: '/refresh', method: 'POST', body: { refreshToken }, validateStatus: () => true }),
      transformResponse: toResult,
      invalidatesTags: ['Sessions'],
    }),
    logout: builder.mutation<CallResult, { refreshToken: string; allDevices?: boolean }>({
      query: (body) => ({ url: '/logout', method: 'POST', body, validateStatus: () => true }),
      transformResponse: toResult,
      invalidatesTags: ['Sessions'],
    }),
    me: builder.mutation<CallResult, string>({
      query: (accessToken) => ({ url: '/me', headers: { authorization: `Bearer ${accessToken}` }, validateStatus: () => true }),
      transformResponse: toResult,
    }),
    sessions: builder.query<Session[], void>({
      query: () => '/sessions',
      providesTags: ['Sessions'],
    }),
    reset: builder.mutation<{ ok: boolean }, void>({
      query: () => ({ url: '/reset', method: 'POST' }),
      invalidatesTags: ['Sessions'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRefreshMutation,
  useLogoutMutation,
  useMeMutation,
  useSessionsQuery,
  useResetMutation,
} = authApi;
