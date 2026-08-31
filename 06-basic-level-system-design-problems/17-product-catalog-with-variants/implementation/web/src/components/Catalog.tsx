'use client';

import { useEffect, useState } from 'react';
import { useGetProductsQuery, useResetMutation } from '../store/catalogApi';
import { money } from '../types';
import { Badge, Button, Card } from './ui';
import { CreateProductForm } from './CreateProductForm';
import { ProductPanel } from './ProductPanel';

export function Catalog() {
  const { data: products } = useGetProductsQuery();
  const [reset] = useResetMutation();
  const [selected, setSelected] = useState<string | null>(null);

  // Auto-select the first product once the catalog loads.
  useEffect(() => {
    if (!selected && products && products.length > 0) setSelected(products[0].id);
  }, [products, selected]);

  return (
    <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'minmax(320px, 1fr) minmax(360px, 1.15fr)' }}>
      <div style={{ display: 'grid', gap: 18, alignContent: 'start' }}>
        <Card title="Catalog" right={<Button variant="danger" onClick={() => { reset(); setSelected(null); }}>reset</Button>}>
          <div style={{ display: 'grid', gap: 8 }}>
            {(products ?? []).map((p) => {
              const active = p.id === selected;
              const range = p.priceRange.min === p.priceRange.max ? money(p.priceRange.min) : `${money(p.priceRange.min)} – ${money(p.priceRange.max)}`;
              return (
                <button key={p.id} onClick={() => setSelected(p.id)} style={{ textAlign: 'left', border: '1px solid ' + (active ? '#2563eb' : '#e2e8f0'), background: active ? '#eff6ff' : '#fff', borderRadius: 10, padding: '10px 12px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{p.title}</span>
                    <span style={{ fontSize: 13, color: '#0f172a' }}>{range}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6, alignItems: 'center' }}>
                    <Badge label="brand" value={p.brand} tone="gray" />
                    <Badge label="variants" value={p.variantCount} tone="blue" />
                    <Badge label="in stock" value={p.inStock} tone={p.inStock > 0 ? 'green' : 'red'} />
                    {p.optionTypes.map((t) => (<Badge key={t.name} value={`${t.name}: ${t.values.length}`} tone="purple" />))}
                  </div>
                </button>
              );
            })}
            {(!products || products.length === 0) && <p style={{ margin: 0, color: '#94a3b8', fontSize: 13 }}>No products.</p>}
          </div>
        </Card>
        <CreateProductForm onCreated={(id) => setSelected(id)} />
      </div>

      {selected ? <ProductPanel productId={selected} /> : <Card title="Product"><p style={{ color: '#64748b' }}>Select a product.</p></Card>}
    </div>
  );
}
