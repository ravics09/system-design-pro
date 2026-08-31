'use client';

import { useState } from 'react';
import { useCreateProductMutation } from '../store/catalogApi';
import { Button, Card, inputStyle } from './ui';

interface OptionDraft {
  name: string;
  valuesText: string;
}

/** Create a product; its variant matrix is generated server-side from the option types. */
export function CreateProductForm({ onCreated }: { onCreated: (id: string) => void }) {
  const [createProduct, { isLoading }] = useCreateProductMutation();
  const [title, setTitle] = useState('Running Shoe');
  const [brand, setBrand] = useState('Acme');
  const [priceDollars, setPriceDollars] = useState('79.00');
  const [options, setOptions] = useState<OptionDraft[]>([
    { name: 'Size', valuesText: '8, 9, 10' },
    { name: 'Color', valuesText: 'Black, White' },
  ]);
  const [err, setErr] = useState<string | null>(null);

  const setOpt = (i: number, patch: Partial<OptionDraft>) =>
    setOptions((o) => o.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const addOpt = () => setOptions((o) => [...o, { name: '', valuesText: '' }]);
  const removeOpt = (i: number) => setOptions((o) => o.filter((_, idx) => idx !== i));

  const projected = options.reduce((n, o) => {
    const vals = o.valuesText.split(',').map((s) => s.trim()).filter(Boolean);
    return n * Math.max(1, vals.length);
  }, 1);

  const submit = async () => {
    setErr(null);
    const optionTypes = options
      .map((o) => ({ name: o.name.trim(), values: o.valuesText.split(',').map((s) => s.trim()).filter(Boolean) }))
      .filter((o) => o.name && o.values.length > 0);
    const body = { title: title.trim(), brand: brand.trim() || 'Generic', basePrice: Math.round(Number(priceDollars) * 100), optionTypes };
    const res = await createProduct(body);
    if ('error' in res) {
      const e = res.error as { data?: { message?: string } };
      setErr(e.data?.message ?? 'Failed to create product');
    } else if ('data' in res && res.data) {
      onCreated(res.data.id);
    }
  };

  return (
    <Card title="Create product" right={<span style={{ fontSize: 12, color: '#64748b' }}>→ {projected} variants</span>}>
      <div style={{ display: 'grid', gap: 8 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" style={inputStyle} />
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Brand" style={inputStyle} />
          <input value={priceDollars} onChange={(e) => setPriceDollars(e.target.value)} placeholder="Base price ($)" style={inputStyle} />
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginTop: 4 }}>Option types (comma-separated values)</div>
        {options.map((o, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input value={o.name} onChange={(e) => setOpt(i, { name: e.target.value })} placeholder="e.g. Size" style={{ ...inputStyle, flex: '0 0 110px' }} />
            <input value={o.valuesText} onChange={(e) => setOpt(i, { valuesText: e.target.value })} placeholder="e.g. S, M, L" style={inputStyle} />
            <button onClick={() => removeOpt(i)} style={{ border: '1px solid #cbd5e1', background: '#fff', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}>×</button>
          </div>
        ))}
        <div>
          <Button variant="ghost" onClick={addOpt}>+ option type</Button>
        </div>
        <div>
          <Button onClick={submit} disabled={isLoading}>{isLoading ? 'Creating…' : 'Create product'}</Button>
        </div>
        {err && <div style={{ color: '#991b1b', fontSize: 12 }}>{err}</div>}
      </div>
    </Card>
  );
}
