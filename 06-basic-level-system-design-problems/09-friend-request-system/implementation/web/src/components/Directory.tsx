"use client";

import { useState } from "react";
import { useGetUsersQuery, useGetOverviewQuery, ME_ID } from "../store/friendsApi";
import { statusFromOverview } from "../lib/status";
import { PersonRow } from "./PersonRow";

type Tab = "directory" | "friends" | "incoming" | "outgoing";

/** Directory of people + tabs derived from the current user's overview. */
export function Directory() {
  const [tab, setTab] = useState<Tab>("directory");
  const { data: users, isLoading: loadingUsers, isError } = useGetUsersQuery();
  const { data: overview } = useGetOverviewQuery();

  if (loadingUsers) return <p>Loading…</p>;
  if (isError) return <p style={{ color: "#c0392b" }}>Couldn&apos;t reach the API. Is it running & seeded?</p>;

  const others = (users ?? []).filter((u) => u.id !== ME_ID);
  const inTab = (id: string): boolean => {
    if (tab === "directory") return true;
    if (tab === "friends") return overview?.friends.includes(id) ?? false;
    if (tab === "incoming") return overview?.incoming.includes(id) ?? false;
    if (tab === "outgoing") return overview?.outgoing.includes(id) ?? false;
    return true;
  };

  const counts = {
    friends: overview?.friends.length ?? 0,
    incoming: overview?.incoming.length ?? 0,
    outgoing: overview?.outgoing.length ?? 0,
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "directory", label: "People" },
    { key: "friends", label: `Friends (${counts.friends})` },
    { key: "incoming", label: `Incoming (${counts.incoming})` },
    { key: "outgoing", label: `Outgoing (${counts.outgoing})` },
  ];

  const visible = others.filter((u) => inTab(u.id));

  return (
    <section style={{ maxWidth: 620, margin: "0 auto", padding: 16 }}>
      <h1>Friends</h1>
      <p style={{ color: "#666" }}>
        You are <strong>@{ME_ID}</strong>. Actions reflect the relationship state machine.
      </p>

      <div style={{ display: "flex", gap: 6, margin: "12px 0" }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ fontWeight: tab === t.key ? 700 : 400 }}>
            {t.label}
          </button>
        ))}
      </div>

      {visible.length === 0 && <p style={{ color: "#666" }}>Nobody here.</p>}
      {visible.map((u) => (
        <PersonRow key={u.id} user={u} status={statusFromOverview(overview, u.id)} />
      ))}
    </section>
  );
}
