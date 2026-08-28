import type { ReactNode } from "react";
import { Providers } from "../store/Providers";

export const metadata = {
  title: "Friend Requests",
  description: "Next.js + Redux Toolkit UI over a NestJS friend request state machine",
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
