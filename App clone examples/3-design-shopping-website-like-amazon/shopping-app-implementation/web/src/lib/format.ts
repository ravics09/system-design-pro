/** Format integer minor units (cents) into a localized currency string. */
export function formatMoney(cents: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format((cents ?? 0) / 100);
  } catch {
    // Unknown currency code → fall back to a plain number with the code appended.
    return `${((cents ?? 0) / 100).toFixed(2)} ${currency}`;
  }
}
