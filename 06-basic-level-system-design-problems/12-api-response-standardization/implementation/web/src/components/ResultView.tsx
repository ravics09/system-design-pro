"use client";

import type { CallResult } from "../types";
import { Badge } from "./ui";

/**
 * Renders one API call outcome, surfacing all three concerns at a glance:
 *  - Response standardization: success/error envelope + machine `code`.
 *  - Versioning: meta.version + a deprecation banner (from the Deprecation/Sunset
 *    response headers).
 *  - Tracing: meta.requestId AND the X-Request-Id header — shown side by side so
 *    you can confirm they match.
 */
export function ResultView({ result }: { result: CallResult | null }) {
  if (!result) {
    return <p style={{ color: "#64748b", fontSize: 14 }}>Run a call to see its response envelope, version, and request id.</p>;
  }

  const { envelope, status, ok, requestIdHeader, deprecation, sunset } = result;
  const isSuccess = envelope?.success === true;
  const metaId = envelope?.meta?.requestId ?? null;
  const idsMatch = metaId != null && requestIdHeader != null && metaId === requestIdHeader;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Badge label="HTTP" value={status} tone={ok ? "green" : "red"} />
        <Badge label="envelope" value={isSuccess ? "success" : "error"} tone={isSuccess ? "green" : "red"} />
        {envelope?.meta?.version != null && <Badge label="version" value={`v${envelope.meta.version}`} tone="blue" />}
        {!isSuccess && "error" in envelope && <Badge label="code" value={envelope.error.code} tone="red" mono />}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Badge label="meta.requestId" value={metaId ?? "—"} tone="neutral" mono />
        <Badge label="X-Request-Id hdr" value={requestIdHeader ?? "—"} tone="neutral" mono />
        <Badge label="ids match" value={idsMatch ? "yes" : "no"} tone={idsMatch ? "green" : "amber"} />
      </div>

      {deprecation === "true" && (
        <div
          style={{
            background: "#fffbeb",
            border: "1px solid #fcd34d",
            color: "#92400e",
            borderRadius: 8,
            padding: "10px 12px",
            fontSize: 13,
          }}
        >
          ⚠️ <strong>Deprecated endpoint.</strong> Migrate to v2.{sunset ? ` Sunset: ${sunset}` : ""}
        </div>
      )}

      {envelope?.meta?.pagination && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Badge label="page.limit" value={envelope.meta.pagination.limit} />
          <Badge label="hasMore" value={String(envelope.meta.pagination.hasMore)} />
          <Badge label="nextCursor" value={envelope.meta.pagination.nextCursor ?? "null"} mono />
        </div>
      )}

      <pre
        style={{
          margin: 0,
          background: "#0f172a",
          color: "#e2e8f0",
          borderRadius: 8,
          padding: 14,
          fontSize: 12.5,
          overflowX: "auto",
          lineHeight: 1.5,
        }}
      >
        {JSON.stringify(envelope, null, 2)}
      </pre>
    </div>
  );
}
