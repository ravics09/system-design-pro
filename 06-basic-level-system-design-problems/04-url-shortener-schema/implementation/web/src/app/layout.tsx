import type { ReactNode } from "react";
import { Providers } from "../store/Providers";

export const metadata = {
  title: "URL Shortener",
  description: "Next.js + Redux Toolkit (RTK Query) client for the NestJS URL shortener",
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
