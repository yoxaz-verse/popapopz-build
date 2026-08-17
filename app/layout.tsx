import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "POPAPOPZ Engineering Studio",
  description: "Internal engineering workspace for the POPAPOPZ smart beverage dispensing machine."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
