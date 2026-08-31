import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3013';

export interface ValidationError {
  error: 'VALIDATION_ERROR';
  message: string;
  fieldErrors: Record<string, string[]>;
  formErrors: string[];
}

/**
 * Every call is a mutation with `validateStatus: () => true` so a 400/413 comes back as
 * data (not a thrown error) — the playground renders success and validation-error bodies
 * uniformly, reading the HTTP status off `meta.response`.
 */
export interface CallResult {
  status: number;
  ok: boolean;
  body: unknown;
}

function toResult(body: unknown, meta: { response?: Response } | undefined): CallResult {
  return { status: meta?.response?.status ?? 0, ok: meta?.response?.ok ?? false, body };
}

export const validationApi = createApi({
  reducerPath: 'validationApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL }),
  endpoints: (builder) => ({
    createUser: builder.mutation<CallResult, unknown>({
      query: (body) => ({ url: '/users', method: 'POST', body, validateStatus: () => true }),
      transformResponse: toResult,
    }),
    search: builder.mutation<CallResult, string>({
      query: (qs) => ({ url: `/search?${qs}`, validateStatus: () => true }),
      transformResponse: toResult,
    }),
    dateRange: builder.mutation<CallResult, unknown>({
      query: (body) => ({ url: '/date-range', method: 'POST', body, validateStatus: () => true }),
      transformResponse: toResult,
    }),
    upload: builder.mutation<CallResult, unknown>({
      query: (body) => ({ url: '/upload', method: 'POST', body, validateStatus: () => true }),
      transformResponse: toResult,
    }),
  }),
});

export const { useCreateUserMutation, useSearchMutation, useDateRangeMutation, useUploadMutation } = validationApi;
