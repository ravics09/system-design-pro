'use client';

import { useState, type FormEvent } from 'react';
import { useCreateAddressMutation } from '../store/api';
import type { Address, CreateAddressInput } from '../types';

const empty: CreateAddressInput = {
  name: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  zip: '',
  country: '',
  phone: '',
};

/** Reusable "add a shipping address" form, used on the addresses page and at checkout. */
export function AddressForm({ onCreated }: { onCreated?: (address: Address) => void }) {
  const [createAddress, { isLoading }] = useCreateAddressMutation();
  const [form, setForm] = useState<CreateAddressInput>(empty);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof CreateAddressInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await createAddress(form);
    if ('data' in res && res.data) {
      setForm(empty);
      onCreated?.(res.data);
    } else {
      const err = res.error as { data?: { message?: string | string[] } } | undefined;
      const msg = err?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Could not save address');
    }
  };

  const field = { display: 'grid', gap: 4, fontSize: '0.8rem', fontWeight: 700 } as const;

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 10 }}>
      <label style={field}>
        Full name
        <input className="input" value={form.name} onChange={set('name')} required />
      </label>
      <label style={field}>
        Address line 1
        <input className="input" value={form.line1} onChange={set('line1')} required />
      </label>
      <label style={field}>
        Address line 2 (optional)
        <input className="input" value={form.line2} onChange={set('line2')} />
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <label style={field}>
          City
          <input className="input" value={form.city} onChange={set('city')} required />
        </label>
        <label style={field}>
          State / Region
          <input className="input" value={form.state} onChange={set('state')} />
        </label>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <label style={field}>
          ZIP / Postal code
          <input className="input" value={form.zip} onChange={set('zip')} required />
        </label>
        <label style={field}>
          Country
          <input className="input" value={form.country} onChange={set('country')} required />
        </label>
      </div>
      <label style={field}>
        Phone (optional)
        <input className="input" value={form.phone} onChange={set('phone')} />
      </label>
      {error && <div className="error">{error}</div>}
      <button className="btn btn-primary" type="submit" disabled={isLoading}>
        {isLoading ? 'Saving…' : 'Save address'}
      </button>
    </form>
  );
}
