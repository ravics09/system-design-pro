import { EnqueueForm } from '../components/EnqueueForm';
import { JobsTable } from '../components/JobsTable';
import { StatsPanel } from '../components/StatsPanel';
import { WorkerControls } from '../components/WorkerControls';

export default function Page() {
  return (
    <main style={{ maxWidth: 1140, margin: '0 auto', padding: '32px 20px 56px' }}>
      <header style={{ marginBottom: 22 }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 26 }}>Job / Task Queue</h1>
        <p style={{ margin: 0, color: '#475569', fontSize: 15, maxWidth: 820 }}>
          Enqueue background jobs and watch a worker pool drain them. Jobs flow through{' '}
          <strong>waiting → active → completed</strong>; failures <strong>retry with exponential backoff</strong> and,
          once attempts are exhausted, land in the <strong>dead-letter queue</strong>. Try a job with{' '}
          <code>failTimes=1</code> (succeeds on retry), one with <code>alwaysFail</code> (ends up dead), a{' '}
          <code>delayMs</code> job (scheduled later), or a high <code>priority</code> to jump the line.
        </p>
      </header>

      <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'minmax(360px, 1fr) minmax(360px, 1fr)' }}>
        <div style={{ display: 'grid', gap: 18, alignContent: 'start' }}>
          <EnqueueForm />
          <WorkerControls />
        </div>
        <StatsPanel />
      </div>

      <div style={{ marginTop: 18 }}>
        <JobsTable />
      </div>
    </main>
  );
}
