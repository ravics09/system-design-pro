import { createHash } from 'node:crypto';

export const FORMATS = ['webp', 'avif', 'jpeg', 'png'] as const;
export type Format = (typeof FORMATS)[number];

export interface Transform {
  width: number | null;
  format: Format;
  quality: number;
  fit: 'cover' | 'contain' | 'inside';
}

/**
 * Parse + validate transform params. Width is clamped to a whitelist to prevent a cache-buster
 * DoS (an attacker requesting millions of unique sizes). Pure + testable.
 */
export function parseTransform(query: Record<string, unknown>, allowedWidths: number[]): Transform {
  const rawW = Number(query.w);
  const width = allowedWidths.includes(rawW) ? rawW : allowedWidths[0] ?? null;
  const format = (FORMATS as readonly string[]).includes(String(query.format)) ? (query.format as Format) : 'webp';
  let quality = Number(query.q);
  if (!Number.isFinite(quality) || quality < 1 || quality > 100) quality = 80;
  const fit = ['cover', 'contain', 'inside'].includes(String(query.fit)) ? (query.fit as Transform['fit']) : 'cover';
  return { width, format, quality: Math.round(quality), fit };
}

/** Deterministic cache key: identical transform params → same key → generate once. */
export function cacheKey(id: string, t: Transform): string {
  const h = createHash('sha256').update(`${id}|${t.width}|${t.format}|${t.quality}|${t.fit}`).digest('hex').slice(0, 16);
  return `${id}_${h}.${t.format}`;
}
