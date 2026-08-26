import type { ReactNode } from "react";
import { Providers } from "../store/Providers";

export const metadata = {
  title: "Shopping Cart",
  description: "Next.js + Redux Toolkit (RTK Query) storefront over a NestJS shopping cart API",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
