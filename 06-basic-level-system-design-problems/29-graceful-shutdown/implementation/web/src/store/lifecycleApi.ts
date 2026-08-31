import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Status } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3016';

export interface CallResult {
  status: number;
  ok: boolean;
  body: unknown;
  ms: number;
}

export const lifecycleApi = createApi({
  reducerPath: 'lifecycleApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL }),
  tagTypes: ['Status'],
  endpoints: (builder) => ({
    getStatus: builder.query<Status, void>({
      query: () => '/status',
      providesTags: ['Status'],
    }),
    shutdown: builder.mutation<Status, void>({
      query: () => ({ url: '/shutdown', method: 'POST' }),
      invalidatesTags: ['Status'],
    }),
    reset: builder.mutation<Status, void>({
      query: () => ({ url: '/reset', method: 'POST' }),
      invalidatesTags: ['Status'],
    }),
    // A slow request; validateStatus lets a 503 (rejected during drain) return as data.
    work: builder.mutation<CallResult, number>({
      queryFn: async (ms, _api, _extra, baseQuery) => {
        const started = Date.now();
        const res = await baseQuery({ url: `/work?ms=${ms}`, validateStatus: () => true });
        const response = (res.meta as { response?: Response } | undefined)?.response;
        return { data: { status: response?.status ?? 0, ok: response?.ok ?? false, body: res.data, ms: Date.now() - started } };
      },
      invalidatesTags: ['Status'],
    }),
  }),
});

export const { useGetStatusQuery, useShutdownMutation, useResetMutation, useWorkMutation } = lifecycleApi;
