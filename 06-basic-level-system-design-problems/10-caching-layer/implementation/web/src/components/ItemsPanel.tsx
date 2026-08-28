"use client";

import { useState } from "react";
import {
  useGetItemsQuery,
  useReadItemMutation,
  useUpdateItemMutation,
} from "../store/cacheApi";
import type { ItemRead } from "../types";

/** Fetch items through the cache; each fetch shows HIT/MISS + latency. */
export function ItemsPanel() {
  const { data: items, isLoading, isError } = useGetItemsQuery();
  const [readItem] = useReadItemMutation();
  const [updateItem] = useUpdateItemMutation();
  const [reads, setReads] = useState<Record<string, ItemRead>>({});

  const fetchItem = async (id: string) => {
    const res = await readItem(id).unwrap();
    setReads((prev) => ({ ...prev, [id]: res }));
  };

  const bump = async (id: string, current: number) => {
    await updateItem({ id, value: current + 1 }).unwrap();
    await fetchItem(id); // re-read: write-through keeps it a HIT with the fresh value
  };

  if (isLoading) return <p>Loading…</p>;
  if (isError) return <p style={{ color: "#c0392b" }}>Couldn&apos;t reach the API. Is it running?</p>;

  return (
    <section>
      <h2 style={{ marginTop: 0 }}>Items (cache-aside reads)</h2>
      <p style={{ color: "#666", fontSize: 13 }}>
        First fetch is a <strong>MISS</strong> (slow origin). Fetch again for a fast <strong>HIT</strong>.
        Flush the cache to make it miss again.
      </p>
      {items?.map((item) => {
        const r = reads[item.id];
        return (
          <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f2f2f2" }}>
            <div>
              <strong>{item.name}</strong> <span style={{ color: "#999" }}>(value {item.value})</span>
              {r && (
                <span
                  style={{
                    marginLeft: 10,
                    fontSize: 12,
                    padding: "2px 8px",
                    borderRadius: 10,
                    background: r.cached ? "#e8f5e9" : "#fff3e0",
                    color: r.cached ? "#2e7d32" : "#e65100",
                  }}
                >
                  {r.cached ? "HIT" : "MISS"} · {r.ms} ms
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => fetchItem(item.id)}>Fetch</button>
              <button onClick={() => bump(item.id, item.value)}>+1 (write-through)</button>
            </div>
          </div>
        );
      })}
    </section>
  );
}
