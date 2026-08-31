import type { ReactNode } from 'react';
import { Providers } from '../store/Providers';

export const metadata = {
  title: 'Request Validation Middleware',
  description: 'Next.js + Redux Toolkit playground for a NestJS Zod validation layer: coercion, field errors, size guard.',
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
