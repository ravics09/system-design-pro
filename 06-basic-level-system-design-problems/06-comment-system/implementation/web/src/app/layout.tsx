import type { ReactNode } from "react";
import { Providers } from "../store/Providers";

export const metadata = {
  title: "Comment System",
  description: "Next.js + Redux Toolkit threaded comments over a NestJS materialized-path API",
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
