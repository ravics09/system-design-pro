"use client";

import { useState } from "react";
import { useGetThreadQuery } from "../store/commentsApi";
import type { SortOrder } from "../types";
import { CommentForm } from "./CommentForm";
import { CommentNode } from "./CommentNode";

const POST_ID = process.env.NEXT_PUBLIC_POST_ID ?? "post-1";

/** Top-level thread view: new/top sort toggle, composer, and recursive tree. */
export function Thread() {
  const [sort, setSort] = useState<SortOrder>("new");
  const { data, isLoading, isError, refetch } = useGetThreadQuery({ postId: POST_ID, sort });

  return (
    <section style={{ maxWidth: 680, margin: "0 auto", padding: 16 }}>
      <h1>Comments</h1>
      <CommentForm />

      <div style={{ display: "flex", gap: 8, margin: "12px 0", fontSize: 13 }}>
        <span>Sort:</span>
        {(["new", "top"] as SortOrder[]).map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            style={{ fontWeight: sort === s ? 700 : 400 }}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading && <p>Loading…</p>}
      {isError && (
        <p style={{ color: "#c0392b" }}>
          Couldn&apos;t load comments. Is the API running? <button onClick={() => refetch()}>Retry</button>
        </p>
      )}

      {data && data.roots.length === 0 && <p style={{ color: "#666" }}>No comments yet — be first!</p>}

      {data?.roots.map((node) => (
        <CommentNode key={node.id} node={node} />
      ))}

      {data?.pageInfo.hasNextPage && (
        <p style={{ color: "#999", fontSize: 13 }}>More top-level comments available (cursor pagination).</p>
      )}
    </section>
  );
}
