import type { Metadata } from "next";
import { Anton, Barlow_Condensed, Roboto_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";
import "./globals.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-barlow",
  display: "swap",
});

const robotoMono = Roboto_Mono({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-roboto-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BASKTBALL - Dominate The Data",
  description: "Real-time basketball stats, analytics, and insights for NBA, WNBA, NCAA, and international leagues.",
  keywords: ["basketball", "NBA", "WNBA", "NCAA", "stats", "analytics", "live scores"],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en" className={`${anton.variable} ${barlowCondensed.variable} ${robotoMono.variable}`}>
      <body>
        <SessionProvider session={session}>
          {/* Court Background Pattern */}
          <div className="court-bg">
            <div className="court-accent"></div>
            <div className="court-accent"></div>
            <div className="court-accent"></div>
          </div>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
