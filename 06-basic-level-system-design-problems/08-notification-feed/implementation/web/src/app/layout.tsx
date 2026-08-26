import type { ReactNode } from "react";
import { Providers } from "../store/Providers";

export const metadata = {
  title: "Real-Time Notifications",
  description: "Next.js + Redux Toolkit + socket.io real-time notifications over a NestJS gateway",
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
