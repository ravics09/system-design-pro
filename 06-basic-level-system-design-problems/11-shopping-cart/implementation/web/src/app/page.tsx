import { ProductGrid } from "../components/ProductGrid";
import { CartPanel } from "../components/CartPanel";

export default function HomePage() {
  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
      <h1>Storefront</h1>
      <p style={{ color: "#666" }}>
        Prices and totals are computed on the server — the cart only stores product ids and quantities.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, alignItems: "start" }}>
        <ProductGrid />
        <CartPanel />
      </div>
    </main>
  );
}
