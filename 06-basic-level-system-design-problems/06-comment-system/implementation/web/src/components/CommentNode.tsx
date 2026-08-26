"use client";

import { useState } from "react";
import type { CommentNode as CommentNodeType } from "../types";
import { useVoteMutation } from "../store/commentsApi";
import { CommentForm } from "./CommentForm";

/**
 * Renders one comment and RECURSES over its children, indenting by depth. This
 * mirrors the nested tree the API returns (materialized path assembled server-side).
 */
export function CommentNode({ node }: { node: CommentNodeType }) {
  const [replying, setReplying] = useState(false);
  const [vote, { isLoading: voting }] = useVoteMutation();

  return (
    <div
      style={{
        borderLeft: node.depth > 0 ? "2px solid #eee" : "none",
        paddingLeft: node.depth > 0 ? 12 : 0,
        marginTop: 8,
      }}
    >
      <div style={{ fontSize: 13, color: "#666" }}>
        <strong style={{ color: node.deleted ? "#999" : "#333" }}>
          {node.deleted ? "[deleted]" : node.authorId}
        </strong>{" "}
        · {new Date(node.createdAt).toLocaleString()} · score {node.score}
      </div>

      <div style={{ margin: "4px 0", color: node.deleted ? "#999" : "#111", fontStyle: node.deleted ? "italic" : "normal" }}>
        {node.body}
      </div>

      <div style={{ display: "flex", gap: 10, fontSize: 13 }}>
        <button disabled={voting} onClick={() => vote({ id: node.id, dir: 1 })}>▲</button>
        <button disabled={voting} onClick={() => vote({ id: node.id, dir: -1 })}>▼</button>
        <button onClick={() => setReplying((r) => !r)}>{replying ? "Cancel" : "Reply"}</button>
        {node.replyCount > 0 && <span style={{ color: "#999" }}>{node.replyCount} replies</span>}
      </div>

      {replying && (
        <CommentForm parentId={node.id} placeholder="Write a reply…" onDone={() => setReplying(false)} />
      )}

      {node.children.length > 0 && (
        <div>
          {node.children.map((child) => (
            <CommentNode key={child.id} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}
