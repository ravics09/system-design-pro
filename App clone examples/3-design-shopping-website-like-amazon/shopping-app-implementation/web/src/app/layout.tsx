import './globals.css';
import type { ReactNode } from 'react';
import { Providers } from '../store/Providers';
import { Header } from '../components/Header';

export const metadata = {
  title: 'ShopClone — Amazon-style storefront',
  description:
    'An Amazon-style e-commerce storefront (NestJS + MongoDB + WooCommerce REST) — system-design portfolio clone.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          <main className="container">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
