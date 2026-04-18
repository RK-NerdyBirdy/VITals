import type { Metadata } from "next";

import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "VITals",
  description: "Your campus health, simplified.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-vitals-paper text-vitals-charcoal antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
