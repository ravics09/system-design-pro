"use client";

import { useState } from "react";
import {
  useGetCartQuery,
  useSetQtyMutation,
  useRemoveItemMutation,
  useCheckoutMutation,
} from "../store/cartApi";
import { formatCents } from "../lib/money";
import type { Order } from "../types";

/** The cart: server-computed line items + total, qty controls, and checkout. */
export function CartPanel() {
  const { data: cart, isLoading } = useGetCartQuery();
  const [setQty] = useSetQtyMutation();
  const [removeItem] = useRemoveItemMutation();
  const [checkout, { isLoading: placing }] = useCheckoutMutation();

  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  const placeOrder = async () => {
    setError(null);
    setOrder(null);
    try {
      // A fresh idempotency key per attempt; retrying the SAME key is safe server-side.
      const res = await checkout({ idempotencyKey: `order-${Date.now()}` }).unwrap();
      setOrder(res);
    } catch (e) {
      const msg =
        e && typeof e === "object" && "data" in e
          ? ((e as { data?: { message?: string } }).data?.message ?? "Checkout failed")
          : "Checkout failed";
      setError(msg);
    }
  };

  if (isLoading) return <p>Loading cart…</p>;

  const items = cart?.items ?? [];

  return (
    <aside style={{ border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>Your Cart</h2>

      {items.length === 0 && <p style={{ color: "#666" }}>Cart is empty.</p>}

      {items.map((line) => (
        <div key={line.productId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f2f2f2" }}>
          <div>
            <div style={{ fontWeight: 600 }}>{line.name}</div>
            <div style={{ fontSize: 12, color: "#666" }}>
              {formatCents(line.unitPriceCents, cart?.currency)} · {formatCents(line.lineTotalCents, cart?.currency)}
              {!line.inStock && <span style={{ color: "#c0392b" }}> · low stock</span>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <button onClick={() => setQty({ productId: line.productId, quantity: line.quantity - 1 })}>−</button>
            <span>{line.quantity}</span>
            <button onClick={() => setQty({ productId: line.productId, quantity: line.quantity + 1 })}>+</button>
            <button onClick={() => removeItem(line.productId)} style={{ marginLeft: 6 }}>✕</button>
          </div>
        </div>
      ))}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontWeight: 700 }}>
        <span>Total</span>
        <span>{formatCents(cart?.totalCents ?? 0, cart?.currency)}</span>
      </div>

      <button
        disabled={placing || items.length === 0}
        onClick={placeOrder}
        style={{ marginTop: 12, padding: "8px 16px", width: "100%" }}
      >
        {placing ? "Placing order…" : "Checkout"}
      </button>

      {error && <p style={{ color: "#c0392b" }}>{error}</p>}
      {order && (
        <p style={{ color: "#2e7d32" }}>
          Order placed! #{order.id.slice(-6)} — {formatCents(order.totalCents, cart?.currency)}
        </p>
      )}
    </aside>
  );
}
