"use client";

import { useState } from "react";
import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkReadMutation,
} from "../store/notificationsApi";
import { useNotificationsSocket } from "../hooks/useNotificationsSocket";

const USER_ID = process.env.NEXT_PUBLIC_USER_ID ?? "alice";

/** Bell with a live unread badge + a dropdown list; live-updated over WebSocket. */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  useNotificationsSocket(USER_ID); // live updates → RTK cache

  const { data: unread } = useGetUnreadCountQuery(USER_ID, { pollingInterval: 0 });
  const { data: page, isLoading } = useGetNotificationsQuery(USER_ID);
  const [markRead] = useMarkReadMutation();

  const count = unread?.count ?? 0;

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button onClick={() => setOpen((o) => !o)} style={{ fontSize: 20, position: "relative" }}>
        🔔
        {count > 0 && (
          <span
            style={{
              position: "absolute",
              top: -6,
              right: -8,
              background: "#e0245e",
              color: "#fff",
              borderRadius: 10,
              fontSize: 11,
              padding: "1px 6px",
            }}
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 32,
            width: 340,
            maxHeight: 420,
            overflowY: "auto",
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: 8,
            boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", padding: 10, borderBottom: "1px solid #eee" }}>
            <strong>Notifications</strong>
            <button onClick={() => markRead({ userId: USER_ID, all: true })} disabled={count === 0}>
              Mark all read
            </button>
          </div>

          {isLoading && <p style={{ padding: 12 }}>Loading…</p>}
          {page && page.data.length === 0 && <p style={{ padding: 12, color: "#666" }}>No notifications.</p>}

          {page?.data.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.read && markRead({ userId: USER_ID, ids: [n.id] })}
              style={{
                padding: 10,
                borderBottom: "1px solid #f2f2f2",
                background: n.read ? "#fff" : "#f0f7ff",
                cursor: n.read ? "default" : "pointer",
              }}
            >
              <div style={{ fontSize: 13 }}>
                <strong>{n.type}</strong>
                {typeof n.payload?.text === "string" ? ` — ${n.payload.text}` : ""}
              </div>
              <div style={{ fontSize: 11, color: "#999" }}>{new Date(n.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
