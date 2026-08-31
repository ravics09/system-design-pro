import { Playground } from '../components/Playground';

export default function Page() {
  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px 56px' }}>
      <header style={{ marginBottom: 22 }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 26 }}>Request Validation Middleware</h1>
        <p style={{ margin: 0, color: '#475569', fontSize: 15, maxWidth: 800 }}>
          Every request is parsed against a Zod schema before it reaches the handler: types are{' '}
          <strong>coerced</strong>, <strong>unknown keys stripped</strong> (mass-assignment defense), and failures
          return a consistent <strong>field-keyed 400</strong>. A size/depth guard rejects oversized payloads.
          Edit a payload and submit to see the outcome.
        </p>
      </header>
      <Playground />
    </main>
  );
}
