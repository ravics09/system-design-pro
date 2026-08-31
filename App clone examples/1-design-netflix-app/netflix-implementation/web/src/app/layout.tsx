import './globals.css';
import type { ReactNode } from 'react';
import { Providers } from '../store/Providers';

export const metadata = {
  title: 'Netflix Clone',
  description: 'A Netflix-style streaming UI (NestJS + MongoDB + OMDb) — design-portfolio clone.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
