import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { ConfigValue, KeyMeta, Layer, Resolved, VersionEntry } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3011';

export const configApi = createApi({
  reducerPath: 'configApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL }),
  tagTypes: ['Config', 'Flags', 'Versions'],
  endpoints: (builder) => ({
    getConfig: builder.query<Resolved, boolean>({
      query: (reveal) => `/config?reveal=${reveal ? 'true' : 'false'}`,
      providesTags: ['Config'],
    }),
    getLayers: builder.query<Layer[], boolean>({
      query: (reveal) => `/config/layers?reveal=${reveal ? 'true' : 'false'}`,
      providesTags: ['Config'],
    }),
    getMeta: builder.query<KeyMeta[], void>({
      query: () => '/config/meta',
    }),
    getVersions: builder.query<VersionEntry[], void>({
      query: () => '/versions',
      providesTags: ['Versions'],
    }),
    setOverride: builder.mutation<Resolved, { key: string; value: ConfigValue }>({
      query: (body) => ({ url: '/config/overrides', method: 'POST', body }),
      invalidatesTags: ['Config', 'Versions'],
    }),
    clearOverride: builder.mutation<Resolved, string>({
      query: (key) => ({ url: `/config/overrides/${encodeURIComponent(key)}`, method: 'DELETE' }),
      invalidatesTags: ['Config', 'Versions'],
    }),
    setEnvironment: builder.mutation<Resolved, string>({
      query: (environment) => ({ url: '/config/environment', method: 'POST', body: { environment } }),
      invalidatesTags: ['Config', 'Versions'],
    }),
    setFlag: builder.mutation<Record<string, boolean>, { name: string; value: boolean }>({
      query: (body) => ({ url: '/flags', method: 'POST', body }),
      invalidatesTags: ['Config', 'Versions'],
    }),
    rollback: builder.mutation<Resolved, number>({
      query: (version) => ({ url: `/versions/${version}/rollback`, method: 'POST' }),
      invalidatesTags: ['Config', 'Versions'],
    }),
    reset: builder.mutation<Resolved, void>({
      query: () => ({ url: '/reset', method: 'POST' }),
      invalidatesTags: ['Config', 'Versions'],
    }),
  }),
});

export const {
  useGetConfigQuery,
  useGetLayersQuery,
  useGetMetaQuery,
  useGetVersionsQuery,
  useSetOverrideMutation,
  useClearOverrideMutation,
  useSetEnvironmentMutation,
  useSetFlagMutation,
  useRollbackMutation,
  useResetMutation,
} = configApi;
