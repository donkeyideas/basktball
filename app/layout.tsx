import type { Metadata } from "next";
import { Anton, Barlow_Condensed, Roboto_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import Script from "next/script";
import { auth } from "@/lib/auth";
import "./globals.css";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

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

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://basktball.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "BASKTBALL - Dominate The Data",
    template: "%s | BASKTBALL",
  },
  description: "Real-time basketball stats, analytics, and insights for NBA, WNBA, NCAA, and international leagues.",
  keywords: ["basketball", "NBA", "WNBA", "NCAA", "stats", "analytics", "live scores"],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "BASKTBALL",
    title: "BASKTBALL - Dominate The Data",
    description: "Real-time basketball stats, analytics, and insights for NBA, WNBA, NCAA, and international leagues.",
    url: BASE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "BASKTBALL - Dominate The Data",
    description: "Real-time basketball stats, analytics, and insights for NBA, WNBA, NCAA, and international leagues.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en" className={`${anton.variable} ${barlowCondensed.variable} ${robotoMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "@id": `${BASE_URL}/#organization`,
              name: "BASKTBALL",
              url: BASE_URL,
              logo: `${BASE_URL}/favicon.ico`,
              description: "Real-time basketball stats, analytics, and insights for NBA, WNBA, NCAA, and international leagues.",
              foundingDate: "2024",
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer support",
                url: `${BASE_URL}/contact`,
              },
              sameAs: [
                "https://basktball.com",
              ],
              knowsAbout: [
                "Basketball",
                "NBA",
                "WNBA",
                "NCAA Basketball",
                "Basketball Analytics",
                "Live Basketball Scores",
                "Basketball Statistics",
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "@id": `${BASE_URL}/#website`,
              name: "BASKTBALL",
              url: BASE_URL,
              publisher: { "@id": `${BASE_URL}/#organization` },
              potentialAction: {
                "@type": "SearchAction",
                target: `${BASE_URL}/players?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
      </head>
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
