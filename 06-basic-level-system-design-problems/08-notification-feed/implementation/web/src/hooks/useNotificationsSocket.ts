"use client";

import { useEffect } from "react";
import { io, type Socket } from "socket.io-client";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../store/store";
import { notificationsApi } from "../store/notificationsApi";
import type { NotificationView } from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3004";

/**
 * Opens a WebSocket to the notifications gateway and pushes live events straight
 * into the RTK Query cache — no refetch needed. The handshake carries the userId
 * (a JWT in production); the server pins the socket to `user:<id>`.
 */
export function useNotificationsSocket(userId: string): void {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (!userId) return;
    const socket: Socket = io(API_BASE_URL, {
      auth: { token: userId },
      transports: ["websocket"],
      reconnection: true,
    });

    socket.on("notification", (n: NotificationView) => {
      // Prepend to the list cache (dedupe by id).
      dispatch(
        notificationsApi.util.updateQueryData("getNotifications", userId, (draft) => {
          if (!draft.data.some((x) => x.id === n.id)) draft.data.unshift(n);
        }),
      );
      // Bump the unread badge cache.
      dispatch(
        notificationsApi.util.updateQueryData("getUnreadCount", userId, (draft) => {
          draft.count += 1;
        }),
      );
    });

    return () => {
      socket.close();
    };
  }, [userId, dispatch]);
}
