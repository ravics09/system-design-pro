'use client';

import { useState } from 'react';
import {
  useCreateUserMutation,
  useDateRangeMutation,
  useSearchMutation,
  useUploadMutation,
  type CallResult,
} from '../store/validationApi';
import { Button, Card, ResultView, inputStyle } from './ui';

function JsonCard({
  title,
  hint,
  initial,
  onSubmit,
}: {
  title: string;
  hint: string;
  initial: string;
  onSubmit: (parsed: unknown) => Promise<{ data?: CallResult }>;
}) {
  const [text, setText] = useState(initial);
  const [result, setResult] = useState<CallResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const run = async () => {
    setParseError(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setParseError('Invalid JSON');
      return;
    }
    const res = await onSubmit(parsed);
    if (res.data) setResult(res.data);
  };

  return (
    <Card title={title}>
      <p style={{ margin: '0 0 8px', fontSize: 12.5, color: '#475569' }}>{hint}</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} style={{ ...inputStyle, resize: 'vertical' }} />
      <div style={{ margin: '10px 0' }}>
        <Button onClick={run}>Submit</Button>
        {parseError && <span style={{ color: '#991b1b', fontSize: 12, marginLeft: 8 }}>{parseError}</span>}
      </div>
      <ResultView result={result} />
    </Card>
  );
}

export function Playground() {
  const [createUser] = useCreateUserMutation();
  const [search] = useSearchMutation();
  const [dateRange] = useDateRangeMutation();
  const [upload] = useUploadMutation();

  const [qs, setQs] = useState('page=2&limit=5&active=true');
  const [searchResult, setSearchResult] = useState<CallResult | null>(null);

  return (
    <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
      <JsonCard
        title="POST /users — body validation"
        hint='Try the extra "isAdmin" key (stripped) and a string age (coerced). Break the email to see field errors.'
        initial={JSON.stringify({ name: '  Ada  ', email: 'ada@example.com', age: '42', isAdmin: true }, null, 2)}
        onSubmit={(p) => createUser(p).unwrap().then((data) => ({ data }))}
      />

      <Card title="GET /search — query coercion">
        <p style={{ margin: '0 0 8px', fontSize: 12.5, color: '#475569' }}>
          Query strings are coerced: <code>page</code>→number, <code>active</code>→boolean; defaults applied.
        </p>
        <input value={qs} onChange={(e) => setQs(e.target.value)} style={inputStyle} />
        <div style={{ margin: '10px 0' }}>
          <Button onClick={() => search(qs).unwrap().then((d) => setSearchResult(d))}>Submit</Button>
        </div>
        <ResultView result={searchResult} />
      </Card>

      <JsonCard
        title="POST /date-range — cross-field rule"
        hint="endDate must be after startDate, or you get a formError (top-level)."
        initial={JSON.stringify({ startDate: '2026-05-01', endDate: '2026-04-01' }, null, 2)}
        onSubmit={(p) => dateRange(p).unwrap().then((data) => ({ data }))}
      />

      <JsonCard
        title="POST /upload — size / depth guard"
        hint="Small payloads pass; a body over ~10 KB is rejected with 413 before parsing."
        initial={JSON.stringify({ note: 'small is fine' }, null, 2)}
        onSubmit={(p) => upload(p).unwrap().then((data) => ({ data }))}
      />
    </div>
  );
}
