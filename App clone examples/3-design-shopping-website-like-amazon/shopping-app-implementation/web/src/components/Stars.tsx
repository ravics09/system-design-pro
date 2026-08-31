/** Render a 0–5 rating as filled/empty stars. */
export function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="stars" title={`${rating.toFixed(1)} out of 5`}>
      {'★'.repeat(full)}
      {'☆'.repeat(Math.max(0, 5 - full))}
    </span>
  );
}
