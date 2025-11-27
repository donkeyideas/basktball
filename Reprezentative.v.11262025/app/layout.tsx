"use client";

import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Reprezentative",
  description: "Reprezentative e-commerce platform"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-950 text-neutral-50">
        {children}
      </body>
    </html>
  );
}


