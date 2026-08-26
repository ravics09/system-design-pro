"use client";

import { useGetProductsQuery, useAddItemMutation } from "../store/cartApi";
import { formatCents } from "../lib/money";

/** Catalog grid with an Add-to-cart button per product. */
export function ProductGrid() {
  const { data: products, isLoading, isError, refetch } = useGetProductsQuery();
  const [addItem, { isLoading: adding }] = useAddItemMutation();

  if (isLoading) return <p>Loading products…</p>;
  if (isError) {
    return (
      <p style={{ color: "#c0392b" }}>
        Couldn&apos;t load products. Is the API running & seeded?{" "}
        <button onClick={() => refetch()}>Retry</button>
      </p>
    );
  }
  if (!products || products.length === 0) {
    return <p style={{ color: "#666" }}>No products. POST /products/seed on the API first.</p>;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
      {products.map((p) => (
        <div key={p.id} style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
          <div style={{ fontWeight: 600 }}>{p.name}</div>
          <div style={{ color: "#444", margin: "4px 0" }}>{formatCents(p.priceCents, p.currency)}</div>
          <div style={{ fontSize: 12, color: p.stock > 0 ? "#2e7d32" : "#c0392b" }}>
            {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
          </div>
          <button
            disabled={adding || p.stock === 0}
            onClick={() => addItem({ productId: p.id, quantity: 1 })}
            style={{ marginTop: 8, padding: "6px 12px" }}
          >
            Add to cart
          </button>
        </div>
      ))}
    </div>
  );
}
