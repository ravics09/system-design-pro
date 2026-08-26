import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { NotificationPage, NotificationView } from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3004";

/**
 * RTK Query slice for notifications.
 *
 * The list and unread count are queries; markRead is a mutation that invalidates
 * both. Crucially, live socket events don't go through HTTP — a hook injects them
 * directly into these cache entries via `util.updateQueryData` (see
 * useNotificationsSocket), so the badge and list update instantly.
 */
export const notificationsApi = createApi({
  reducerPath: "notificationsApi",
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL }),
  tagTypes: ["List", "Unread"],
  endpoints: (builder) => ({
    getNotifications: builder.query<NotificationPage, string>({
      query: (userId) => `/notifications?userId=${encodeURIComponent(userId)}&limit=30`,
      providesTags: ["List"],
    }),
    getUnreadCount: builder.query<{ count: number }, string>({
      query: (userId) => `/notifications/unread-count?userId=${encodeURIComponent(userId)}`,
      providesTags: ["Unread"],
    }),
    markRead: builder.mutation<{ count: number }, { userId: string; ids?: string[]; all?: boolean }>({
      query: (body) => ({ url: "/notifications/mark-read", method: "POST", body }),
      invalidatesTags: ["List", "Unread"],
    }),
  }),
});

export const { useGetNotificationsQuery, useGetUnreadCountQuery, useMarkReadMutation } =
  notificationsApi;

/** Exported for the socket hook to push live events into the cache. */
export type LiveNotification = NotificationView;
