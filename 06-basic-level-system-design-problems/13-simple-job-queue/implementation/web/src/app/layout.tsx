import type { ReactNode } from 'react';
import { Providers } from '../store/Providers';

export const metadata = {
  title: 'Job / Task Queue',
  description:
    'Next.js + Redux Toolkit dashboard for a NestJS job/task queue: leases, retries with backoff, dead-letter queue, priorities, delayed jobs, and a worker pool.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, background: '#f1f5f9', color: '#0f172a' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
