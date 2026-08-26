"use client";

import { useGetLinksQuery, useDisableLinkMutation } from "../store/urlsApi";

const OWNER_ID = process.env.NEXT_PUBLIC_OWNER_ID ?? "demo-user";

/** Lists the current owner's links and lets them be disabled. */
export function LinksList() {
  const { data: links, isLoading, isError, refetch } = useGetLinksQuery(OWNER_ID);
  const [disableLink, { isLoading: disabling }] = useDisableLinkMutation();

  if (isLoading) return <p>Loading links…</p>;
  if (isError) {
    return (
      <p style={{ color: "#c0392b" }}>
        Could not load links. Is the API running? <button onClick={() => refetch()}>Retry</button>
      </p>
    );
  }

  if (!links || links.length === 0) return <p style={{ color: "#666" }}>No links yet.</p>;

  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {links.map((link) => (
        <li
          key={link.code}
          style={{
            border: "1px solid #eee",
            borderRadius: 8,
            padding: 12,
            marginBottom: 8,
            opacity: link.disabled ? 0.5 : 1,
          }}
        >
          <div>
            <a href={link.shortUrl} target="_blank" rel="noreferrer">
              <strong>{link.shortUrl}</strong>
            </a>{" "}
            {link.disabled && <span style={{ color: "#c0392b" }}>(disabled)</span>}
          </div>
          <div style={{ color: "#444", fontSize: 14, wordBreak: "break-all" }}>→ {link.longUrl}</div>
          <div style={{ color: "#999", fontSize: 12 }}>
            {link.clicks} clicks · {new Date(link.createdAt).toLocaleString()}
          </div>
          {!link.disabled && (
            <button
              disabled={disabling}
              onClick={() => disableLink({ code: link.code, ownerId: OWNER_ID })}
              style={{ marginTop: 6 }}
            >
              Disable
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
