import type { Metadata } from "next";
import { Anton, Barlow_Condensed, Roboto_Mono } from "next/font/google";
import { Analytics } from "@/components/Analytics";
import "./globals.css";

const anton = Anton({
  weight: "400",
  variable: "--font-anton",
  subsets: ["latin"],
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  weight: ["400", "600", "700", "900"],
  variable: "--font-barlow",
  subsets: ["latin"],
  display: "swap",
});

const robotoMono = Roboto_Mono({
  weight: ["500", "700"],
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Basktball - Basketball Analytics & Advanced Stats",
    template: "%s | Basktball",
  },
  description:
    "Advanced basketball analytics across NBA, WNBA, NCAA, EuroLeague & International Basketball. Live scores, player stats, AI-powered insights, and powerful analytics tools.",
  keywords: [
    "basketball",
    "NBA",
    "WNBA",
    "NCAA",
    "basketball stats",
    "analytics",
    "live scores",
    "player comparison",
    "fantasy basketball",
  ],
  authors: [{ name: "Basktball" }],
  creator: "Basktball",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://basktball.com",
    siteName: "Basktball",
    title: "Basktball - Basketball Analytics & Advanced Stats",
    description:
      "Advanced basketball analytics across NBA, WNBA, NCAA, EuroLeague & International Basketball.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Basktball - Dominate the Data",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Basktball - Basketball Analytics & Advanced Stats",
    description:
      "Advanced basketball analytics across NBA, WNBA, NCAA, EuroLeague & International Basketball.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${anton.variable} ${barlowCondensed.variable} ${robotoMono.variable} antialiased`}
      >
        {/* Google Analytics */}
        <Analytics />

        {/* Court Background Pattern */}
        <div className="court-bg" aria-hidden="true" />

        {/* Main Content */}
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
