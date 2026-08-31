import type { ReactNode } from 'react';
import { Providers } from '../store/Providers';

export const metadata = {
  title: 'Product Catalog with Variants',
  description: 'Next.js + Redux Toolkit storefront for a NestJS catalog: product/variant model, SKU resolution, and inventory.',
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
