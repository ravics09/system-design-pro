'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  useAdjustStockMutation,
  useGetProductQuery,
  useResolveVariantMutation,
  useUpdateVariantMutation,
} from '../store/catalogApi';
import { money, type Variant } from '../types';
import { Badge, Button, Card, inputStyle } from './ui';

/** Product detail: a variant picker that resolves a selection to a live SKU, plus an
 *  inventory/price editor over the full variant matrix. */
export function ProductPanel({ productId }: { productId: string }) {
  const { data: product } = useGetProductQuery(productId);
  const [resolveVariant] = useResolveVariantMutation();
  const [adjustStock] = useAdjustStockMutation();
  const [updateVariant] = useUpdateVariantMutation();

  const [selection, setSelection] = useState<Record<string, string>>({});
  const [resolved, setResolved] = useState<Variant | null>(null);

  // Default the picker to the first value of each option type.
  useEffect(() => {
    if (!product) return;
    const init: Record<string, string> = {};
    for (const t of product.optionTypes) init[t.name] = t.values[0];
    setSelection(init);
  }, [product]);

  const complete = useMemo(
    () => product?.optionTypes.every((t) => selection[t.name]) ?? false,
    [product, selection],
  );

  useEffect(() => {
    if (!product || !complete) return;
    let live = true;
    resolveVariant({ id: product.id, selection })
      .unwrap()
      .then((r) => { if (live) setResolved(r.variant); })
      .catch(() => { if (live) setResolved(null); });
    return () => { live = false; };
  }, [product, selection, complete, resolveVariant]);

  if (!product) return <Card title="Product"><p style={{ color: '#64748b' }}>Loading…</p></Card>;

  return (
    <Card title={product.title} right={<Badge label="brand" value={product.brand} tone="gray" />}>
      {/* Variant picker */}
      <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
        {product.optionTypes.map((t) => (
          <div key={t.name}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>{t.name}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {t.values.map((v) => {
                const active = selection[t.name] === v;
                return (
                  <button key={v} onClick={() => setSelection((s) => ({ ...s, [t.name]: v }))}
                    style={{ border: '1px solid ' + (active ? '#2563eb' : '#cbd5e1'), background: active ? '#2563eb' : '#fff', color: active ? '#fff' : '#334155', borderRadius: 8, padding: '5px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    {v}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Resolved SKU */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, marginBottom: 16 }}>
        {resolved ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <Badge label="sku" value={resolved.sku} tone="blue" mono />
            <Badge label="price" value={money(resolved.price)} tone="neutral" />
            <Badge label="stock" value={resolved.stock} tone={resolved.stock > 0 ? 'green' : 'red'} />
            <Button disabled={resolved.stock <= 0} onClick={() => adjustStock({ sku: resolved.sku, productId: product.id, delta: -1 })}>
              {resolved.stock > 0 ? 'Buy 1 (−stock)' : 'Out of stock'}
            </Button>
          </div>
        ) : (
          <span style={{ color: '#94a3b8', fontSize: 13 }}>No variant for this selection.</span>
        )}
      </div>

      {/* Variant matrix / inventory editor */}
      <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Variant matrix ({product.variants.length})</div>
      <div style={{ overflowX: 'auto', maxHeight: 280, overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '6px 8px', color: '#64748b', fontSize: 11 }}>SKU</th>
              <th style={{ textAlign: 'left', padding: '6px 8px', color: '#64748b', fontSize: 11 }}>options</th>
              <th style={{ textAlign: 'left', padding: '6px 8px', color: '#64748b', fontSize: 11 }}>price</th>
              <th style={{ textAlign: 'left', padding: '6px 8px', color: '#64748b', fontSize: 11 }}>stock</th>
            </tr>
          </thead>
          <tbody>
            {product.variants.map((v) => (
              <tr key={v.sku} style={{ borderTop: '1px solid #f1f5f9' }}>
                <td style={{ padding: '6px 8px', fontFamily: 'ui-monospace, monospace' }}>{v.sku}</td>
                <td style={{ padding: '6px 8px', color: '#475569' }}>{Object.entries(v.options).map(([k, val]) => `${k}:${val}`).join(', ')}</td>
                <td style={{ padding: '6px 8px' }}>
                  <input defaultValue={v.price} type="number" style={{ ...inputStyle, width: 90 }}
                    onBlur={(e) => { const price = Number(e.target.value); if (price !== v.price) updateVariant({ sku: v.sku, productId: product.id, price }); }} />
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <input defaultValue={v.stock} type="number" style={{ ...inputStyle, width: 80 }}
                    onBlur={(e) => { const stock = Number(e.target.value); if (stock !== v.stock) updateVariant({ sku: v.sku, productId: product.id, stock }); }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
