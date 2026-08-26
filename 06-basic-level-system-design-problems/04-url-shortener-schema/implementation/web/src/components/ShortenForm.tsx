"use client";

import { useState, type FormEvent } from "react";
import { useShortenMutation } from "../store/urlsApi";

const OWNER_ID = process.env.NEXT_PUBLIC_OWNER_ID ?? "demo-user";

/** Form that shortens a URL via the RTK Query `shorten` mutation. */
export function ShortenForm() {
  const [longUrl, setLongUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [shorten, { data, error, isLoading }] = useShortenMutation();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await shorten({
        longUrl,
        alias: alias.trim() || undefined,
        ownerId: OWNER_ID,
      }).unwrap();
      setLongUrl("");
      setAlias("");
    } catch {
      /* error surfaced below via `error` */
    }
  };

  const errMessage =
    error && "data" in error
      ? ((error.data as { message?: string })?.message ?? "Request failed")
      : error
        ? "Request failed"
        : null;

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 8, marginBottom: 24 }}>
      <input
        type="url"
        required
        placeholder="https://example.com/very/long/link"
        value={longUrl}
        onChange={(e) => setLongUrl(e.target.value)}
        style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
      />
      <input
        type="text"
        placeholder="custom alias (optional)"
        value={alias}
        onChange={(e) => setAlias(e.target.value)}
        style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
      />
      <button type="submit" disabled={isLoading} style={{ padding: "10px 16px" }}>
        {isLoading ? "Shortening…" : "Shorten"}
      </button>

      {errMessage && <p style={{ color: "#c0392b", margin: 0 }}>{errMessage}</p>}

      {data && (
        <p style={{ margin: 0 }}>
          Short URL:{" "}
          <a href={data.shortUrl} target="_blank" rel="noreferrer">
            {data.shortUrl}
          </a>
        </p>
      )}
    </form>
  );
}
