import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Stats, Submission, SubmissionStatus } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3014';

export interface SubmitResult {
  status: number;
  ok: boolean;
  body: unknown;
}

function toResult(body: unknown, meta: { response?: Response } | undefined): SubmitResult {
  return { status: meta?.response?.status ?? 0, ok: meta?.response?.ok ?? false, body };
}

export const contactApi = createApi({
  reducerPath: 'contactApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL }),
  tagTypes: ['Submissions', 'Stats'],
  endpoints: (builder) => ({
    submit: builder.mutation<SubmitResult, { body: Record<string, unknown>; idempotencyKey: string }>({
      query: ({ body, idempotencyKey }) => ({
        url: '/contact',
        method: 'POST',
        body,
        headers: { 'x-idempotency-key': idempotencyKey },
        validateStatus: () => true,
      }),
      transformResponse: toResult,
      invalidatesTags: ['Submissions', 'Stats'],
    }),
    list: builder.query<Submission[], SubmissionStatus | 'all'>({
      query: (status) => (status === 'all' ? '/contact' : `/contact?status=${status}`),
      providesTags: ['Submissions'],
    }),
    stats: builder.query<Stats, void>({
      query: () => '/stats',
      providesTags: ['Stats'],
    }),
    reset: builder.mutation<{ ok: boolean }, void>({
      query: () => ({ url: '/reset', method: 'POST' }),
      invalidatesTags: ['Submissions', 'Stats'],
    }),
  }),
});

export const { useSubmitMutation, useListQuery, useStatsQuery, useResetMutation } = contactApi;
