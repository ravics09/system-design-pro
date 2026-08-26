"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGetItemsQuery } from "../store/itemsApi";

const PAGE_SIZE = 10;

/**
 * Infinite-scroll feed backed by cursor pagination.
 *
 * Local state holds the current `cursor`. When the sentinel scrolls into view we
 * advance `cursor` to `pageInfo.nextCursor`; RTK Query then fetches the next page
 * and MERGES it onto the accumulated list (see itemsApi.ts). The rendered list
 * therefore grows without any manual cache bookkeeping here.
 */
export function Feed() {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const { data, isFetching, isError, refetch } = useGetItemsQuery({ limit: PAGE_SIZE, cursor });

  const hasNextPage = data?.pageInfo.hasNextPage ?? false;
  const nextCursor = data?.pageInfo.nextCursor ?? undefined;

  const loadMore = useCallback(() => {
    if (isFetching || !hasNextPage || !nextCursor) return;
    if (nextCursor !== cursor) setCursor(nextCursor);
  }, [isFetching, hasNextPage, nextCursor, cursor]);

  // Trigger the next page when the sentinel becomes visible.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const items = data?.items ?? [];

  return (
    <section style={{ maxWidth: 640, margin: "0 auto", padding: 16 }}>
      <h1>Cursor-Paginated Feed</h1>
      <p style={{ color: "#666" }}>
        {items.length} loaded{hasNextPage ? " · scroll for more" : " · end of list"}
      </p>

      {isError && (
        <div style={{ color: "#c0392b" }}>
          Failed to load. Is the API running & seeded? <button onClick={() => refetch()}>Retry</button>
        </div>
      )}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {items.map((item) => (
          <li
            key={item.id}
            style={{ border: "1px solid #eee", borderRadius: 8, padding: 12, marginBottom: 8 }}
          >
            <strong>{item.title}</strong>
            <p style={{ margin: "4px 0", color: "#444" }}>{item.body}</p>
            <small style={{ color: "#999" }}>{new Date(item.createdAt).toLocaleString()}</small>
          </li>
        ))}
      </ul>

      {isFetching && <p>Loading…</p>}

      {/* Sentinel: when this scrolls into view, we fetch the next page. */}
      <div ref={sentinelRef} aria-hidden style={{ height: 1 }} />

      {hasNextPage && !isFetching && (
        <button onClick={loadMore} style={{ padding: "8px 16px" }}>
          Load more
        </button>
      )}
    </section>
  );
}
