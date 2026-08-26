"use client";

import { useState, type FormEvent } from "react";
import { useAddCommentMutation } from "../store/commentsApi";

const POST_ID = process.env.NEXT_PUBLIC_POST_ID ?? "post-1";
const AUTHOR_ID = process.env.NEXT_PUBLIC_AUTHOR_ID ?? "demo-user";

/** Post a top-level comment or a reply (when `parentId` is given). */
export function CommentForm({
  parentId,
  onDone,
  placeholder = "Add a comment…",
}: {
  parentId?: string;
  onDone?: () => void;
  placeholder?: string;
}) {
  const [body, setBody] = useState("");
  const [addComment, { isLoading }] = useAddCommentMutation();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    await addComment({ postId: POST_ID, parentId, authorId: AUTHOR_ID, body }).unwrap();
    setBody("");
    onDone?.();
  };

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 6, margin: "8px 0" }}>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        rows={parentId ? 2 : 3}
        style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6, resize: "vertical" }}
      />
      <div>
        <button type="submit" disabled={isLoading} style={{ padding: "6px 14px" }}>
          {isLoading ? "Posting…" : parentId ? "Reply" : "Comment"}
        </button>
      </div>
    </form>
  );
}
