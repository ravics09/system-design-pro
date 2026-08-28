import { createApi, fetchBaseQuery, type FetchBaseQueryMeta } from "@reduxjs/toolkit/query/react";
import type { ApiEnvelope, CallResult, CreateUserBody } from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3008";

/**
 * Reshape a raw response into a CallResult. `validateStatus: () => true` makes
 * error envelopes (404/400) arrive as `data` too, so the console can render BOTH
 * success and error bodies uniformly. `meta.response` gives us the transport
 * facts: HTTP status + the X-Request-Id / Deprecation / Sunset headers.
 */
function toCallResult<T>(body: unknown, meta: FetchBaseQueryMeta | undefined): CallResult<T> {
  const res = meta?.response;
  return {
    status: res?.status ?? 0,
    ok: res?.ok ?? false,
    envelope: body as ApiEnvelope<T>,
    requestIdHeader: res?.headers.get("x-request-id") ?? null,
    deprecation: res?.headers.get("deprecation") ?? null,
    sunset: res?.headers.get("sunset") ?? null,
  };
}

/**
 * Every endpoint is a MUTATION so a button click always re-fires and yields a
 * fresh envelope + a fresh request id (rather than a cached query result).
 */
export const apiConsoleApi = createApi({
  reducerPath: "apiConsoleApi",
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL }),
  endpoints: (builder) => ({
    listV1: builder.mutation<CallResult, void>({
      query: () => ({ url: "/api/v1/users", validateStatus: () => true }),
      transformResponse: toCallResult,
    }),
    listV2: builder.mutation<CallResult, void>({
      query: () => ({ url: "/api/v2/users", validateStatus: () => true }),
      transformResponse: toCallResult,
    }),
    getUser: builder.mutation<CallResult, { version: "1" | "2"; id: string }>({
      query: ({ version, id }) => ({
        url: `/api/v${version}/users/${encodeURIComponent(id)}`,
        validateStatus: () => true,
      }),
      transformResponse: toCallResult,
    }),
    createUser: builder.mutation<CallResult, CreateUserBody>({
      query: (body) => ({ url: "/api/v2/users", method: "POST", body, validateStatus: () => true }),
      transformResponse: toCallResult,
    }),
    traceDemo: builder.mutation<CallResult, void>({
      query: () => ({ url: "/api/v2/users/trace-demo", validateStatus: () => true }),
      transformResponse: toCallResult,
    }),
  }),
});

export const {
  useListV1Mutation,
  useListV2Mutation,
  useGetUserMutation,
  useCreateUserMutation,
  useTraceDemoMutation,
} = apiConsoleApi;
