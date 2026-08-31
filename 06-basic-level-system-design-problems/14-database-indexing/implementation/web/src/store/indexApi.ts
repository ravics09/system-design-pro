import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { CreateIndexBody, IndexInfo, Query, QueryResult } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3010';

export const indexApi = createApi({
  reducerPath: 'indexApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL }),
  tagTypes: ['Indexes', 'Stats'],
  endpoints: (builder) => ({
    getIndexes: builder.query<IndexInfo[], void>({
      query: () => '/indexes',
      providesTags: ['Indexes'],
    }),
    getStats: builder.query<{ rows: number; indexes: number }, void>({
      query: () => '/stats',
      providesTags: ['Stats'],
    }),
    runQuery: builder.mutation<QueryResult, Query>({
      query: (body) => ({ url: '/query', method: 'POST', body }),
    }),
    createIndex: builder.mutation<IndexInfo, CreateIndexBody>({
      query: (body) => ({ url: '/indexes', method: 'POST', body }),
      invalidatesTags: ['Indexes', 'Stats'],
    }),
    dropIndex: builder.mutation<{ dropped: boolean }, string>({
      query: (name) => ({ url: `/indexes/${encodeURIComponent(name)}`, method: 'DELETE' }),
      invalidatesTags: ['Indexes', 'Stats'],
    }),
    seed: builder.mutation<{ size: number }, number>({
      query: (size) => ({ url: '/seed', method: 'POST', body: { size } }),
      invalidatesTags: ['Stats'],
    }),
    reset: builder.mutation<{ ok: boolean; rows: number; indexes: number }, void>({
      query: () => ({ url: '/reset', method: 'POST' }),
      invalidatesTags: ['Indexes', 'Stats'],
    }),
  }),
});

export const {
  useGetIndexesQuery,
  useGetStatsQuery,
  useRunQueryMutation,
  useCreateIndexMutation,
  useDropIndexMutation,
  useSeedMutation,
  useResetMutation,
} = indexApi;
