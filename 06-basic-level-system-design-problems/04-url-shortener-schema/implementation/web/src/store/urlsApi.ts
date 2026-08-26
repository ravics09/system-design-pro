import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { CreateUrlBody, UrlView } from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3002";

/**
 * RTK Query slice for the URL shortener.
 *
 * - `shorten` is a mutation that invalidates the `Links` list so the UI refreshes.
 * - `getLinks` is a query tagged `Links`, scoped to an owner id.
 * - `disableLink` invalidates the list too.
 */
export const urlsApi = createApi({
  reducerPath: "urlsApi",
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL }),
  tagTypes: ["Links"],
  endpoints: (builder) => ({
    shorten: builder.mutation<UrlView, CreateUrlBody>({
      query: (body) => ({ url: "/api/urls", method: "POST", body }),
      invalidatesTags: ["Links"],
    }),
    getLinks: builder.query<UrlView[], string>({
      query: (ownerId) => `/api/urls?ownerId=${encodeURIComponent(ownerId)}`,
      providesTags: ["Links"],
    }),
    disableLink: builder.mutation<{ ok: true }, { code: string; ownerId: string }>({
      query: ({ code, ownerId }) => ({
        url: `/api/urls/${code}?ownerId=${encodeURIComponent(ownerId)}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Links"],
    }),
  }),
});

export const { useShortenMutation, useGetLinksQuery, useDisableLinkMutation } = urlsApi;
