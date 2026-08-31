'use client';

/** Poster image with a text fallback when OMDb has no artwork. */
export function Poster({ src, title }: { src: string | null; title: string }) {
  if (!src) return <div className="fallback">{title}</div>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={title} loading="lazy" />;
}
