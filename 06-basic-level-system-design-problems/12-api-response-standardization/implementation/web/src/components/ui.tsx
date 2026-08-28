"use client";

import type { CSSProperties, ReactNode } from "react";

/** Small colored pill used for status/version/request-id badges. */
export function Badge({
  label,
  value,
  tone = "neutral",
  mono = false,
}: {
  label: string;
  value: ReactNode;
  tone?: "neutral" | "green" | "red" | "amber" | "blue";
  mono?: boolean;
}) {
  const tones: Record<string, { bg: string; fg: string }> = {
    neutral: { bg: "#eef1f5", fg: "#334155" },
    green: { bg: "#dcfce7", fg: "#166534" },
    red: { bg: "#fee2e2", fg: "#991b1b" },
    amber: { bg: "#fef3c7", fg: "#92400e" },
    blue: { bg: "#dbeafe", fg: "#1e40af" },
  };
  const t = tones[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        gap: 6,
        alignItems: "baseline",
        background: t.bg,
        color: t.fg,
        borderRadius: 999,
        padding: "3px 10px",
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      <span style={{ opacity: 0.7, textTransform: "uppercase", letterSpacing: 0.3 }}>{label}</span>
      <span style={{ fontFamily: mono ? "ui-monospace, monospace" : "inherit" }}>{value}</span>
    </span>
  );
}

export function Button({
  children,
  onClick,
  disabled,
  variant = "primary",
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost";
}) {
  const styles: Record<string, CSSProperties> = {
    primary: { background: "#2563eb", color: "#fff", border: "1px solid #2563eb" },
    ghost: { background: "#fff", color: "#1e293b", border: "1px solid #cbd5e1" },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles[variant],
        padding: "8px 14px",
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {children}
    </button>
  );
}

export function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: 18,
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      <h2 style={{ margin: "0 0 12px", fontSize: 16, color: "#0f172a" }}>{title}</h2>
      {children}
    </section>
  );
}
