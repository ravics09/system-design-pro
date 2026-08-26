"use client";

import { useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3004";
const USER_ID = process.env.NEXT_PUBLIC_USER_ID ?? "alice";

/**
 * Demo trigger: POSTs a notification to the current user so you can watch it
 * arrive over the WebSocket in real time (the bell badge + list update with no
 * page refresh). In production, notifications originate from producer services.
 */
export function DemoControls() {
  const [sending, setSending] = useState(false);

  const send = async (type: string, text: string) => {
    setSending(true);
    try {
      await fetch(`${API_BASE_URL}/notifications`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: USER_ID, type, actorId: "system", payload: { text } }),
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
      <button disabled={sending} onClick={() => send("LIKE", "Someone liked your post")}>
        Simulate LIKE
      </button>
      <button disabled={sending} onClick={() => send("COMMENT", "New comment on your post")}>
        Simulate COMMENT
      </button>
      <button disabled={sending} onClick={() => send("FOLLOW", "You have a new follower")}>
        Simulate FOLLOW
      </button>
    </div>
  );
}
