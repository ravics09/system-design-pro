export interface TotalLine {
  priceCents: number;
  qty: number;
}

export interface Totals {
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
}

const FREE_SHIPPING_THRESHOLD_CENTS = 5000; // $50
const FLAT_SHIPPING_CENTS = 599; // $5.99
const TAX_RATE = 0.08; // 8%

/**
 * Server-authoritative order/cart totals — always in integer cents (never floats).
 * Pure function so it can be unit-tested and reused by both cart and checkout.
 */
export function computeTotals(lines: TotalLine[]): Totals {
  const subtotalCents = lines.reduce((sum, l) => sum + l.priceCents * l.qty, 0);
  const shippingCents = subtotalCents === 0 || subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_CENTS;
  const taxCents = Math.round(subtotalCents * TAX_RATE);
  return { subtotalCents, shippingCents, taxCents, totalCents: subtotalCents + shippingCents + taxCents };
}
