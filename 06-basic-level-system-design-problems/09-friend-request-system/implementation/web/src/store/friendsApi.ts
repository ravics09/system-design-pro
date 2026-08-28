import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Overview, User } from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3006";
const ME = process.env.NEXT_PUBLIC_USER_ID ?? "alice";

/**
 * RTK Query slice for the friend system. Every mutation invalidates `Overview`,
 * so the People directory + Friends/Incoming/Outgoing tabs re-derive from a
 * single fresh source (the current user's grouped relationships).
 */
export const friendsApi = createApi({
  reducerPath: "friendsApi",
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL }),
  tagTypes: ["Overview"],
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => "/users",
    }),
    getOverview: builder.query<Overview, void>({
      query: () => `/friendships/${encodeURIComponent(ME)}/overview`,
      providesTags: ["Overview"],
    }),
    request: builder.mutation<unknown, string>({
      query: (to) => ({ url: "/friendships/request", method: "POST", body: { from: ME, to } }),
      invalidatesTags: ["Overview"],
    }),
    respond: builder.mutation<unknown, { otherId: string; action: "accept" | "decline" }>({
      query: ({ otherId, action }) => ({
        url: "/friendships/respond",
        method: "POST",
        body: { userId: ME, otherId, action },
      }),
      invalidatesTags: ["Overview"],
    }),
    cancel: builder.mutation<unknown, string>({
      query: (otherId) => ({ url: "/friendships/cancel", method: "POST", body: { userId: ME, otherId } }),
      invalidatesTags: ["Overview"],
    }),
    unfriend: builder.mutation<unknown, string>({
      query: (otherId) => ({ url: "/friendships/unfriend", method: "POST", body: { userId: ME, otherId } }),
      invalidatesTags: ["Overview"],
    }),
    block: builder.mutation<unknown, string>({
      query: (otherId) => ({ url: "/friendships/block", method: "POST", body: { userId: ME, otherId } }),
      invalidatesTags: ["Overview"],
    }),
    unblock: builder.mutation<unknown, string>({
      query: (otherId) => ({ url: "/friendships/unblock", method: "POST", body: { userId: ME, otherId } }),
      invalidatesTags: ["Overview"],
    }),
  }),
});

export const ME_ID = ME;
export const {
  useGetUsersQuery,
  useGetOverviewQuery,
  useRequestMutation,
  useRespondMutation,
  useCancelMutation,
  useUnfriendMutation,
  useBlockMutation,
  useUnblockMutation,
} = friendsApi;
