import { AdminInbox } from '../components/AdminInbox';
import { ContactForm } from '../components/ContactForm';

export default function Page() {
  return (
    <main style={{ maxWidth: 1160, margin: '0 auto', padding: '32px 20px 56px' }}>
      <header style={{ marginBottom: 22 }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 26 }}>Contact Form Submission System</h1>
        <p style={{ margin: 0, color: '#475569', fontSize: 15, maxWidth: 840 }}>
          Submissions run a pipeline: <strong>validate → honeypot → per-IP rate limit → spam score →
          persist → async notify</strong>. Accepted messages are delivered by a background worker (watch the{' '}
          <strong>notify</strong> column flip to <em>sent</em>). Try the &quot;simulate bot&quot; checkbox, a spammy
          message, or submit repeatedly to trip the rate limit.
        </p>
      </header>
      <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'minmax(320px, 1fr) minmax(420px, 1.4fr)' }}>
        <ContactForm />
        <AdminInbox />
      </div>
    </main>
  );
}
