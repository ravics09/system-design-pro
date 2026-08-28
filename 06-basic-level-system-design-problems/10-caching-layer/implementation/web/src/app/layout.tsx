import type { ReactNode } from "react";
import { Providers } from "../store/Providers";

export const metadata = {
  title: "Caching Layer",
  description: "Next.js + Redux Toolkit dashboard for a NestJS cache-aside caching layer",
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
