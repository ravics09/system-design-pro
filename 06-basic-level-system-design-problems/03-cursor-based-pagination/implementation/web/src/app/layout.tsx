import type { ReactNode } from "react";
import { Providers } from "../store/Providers";

export const metadata = {
  title: "Cursor Pagination Demo",
  description: "Next.js + Redux Toolkit (RTK Query) infinite-scroll over a cursor-paginated API",
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
