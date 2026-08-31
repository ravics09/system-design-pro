import { Catalog } from '../components/Catalog';

export default function Page() {
  return (
    <main style={{ maxWidth: 1120, margin: '0 auto', padding: '32px 20px 56px' }}>
      <header style={{ marginBottom: 22 }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 26 }}>Product Catalog with Variants</h1>
        <p style={{ margin: 0, color: '#475569', fontSize: 15, maxWidth: 820 }}>
          A <strong>product</strong> owns option types (Size, Color); their combinations generate concrete{' '}
          <strong>variants (SKUs)</strong>, each with its own price and stock. Pick options to{' '}
          <strong>resolve a live SKU</strong>, edit the <strong>variant matrix</strong>, or create a new product and
          watch its variants generate.
        </p>
      </header>
      <Catalog />
    </main>
  );
}
