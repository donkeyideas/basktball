import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Scores",
  description:
    "Watch NBA, WNBA, and NCAA basketball games live. Real-time scores, play-by-play updates, and live game tracking.",
  keywords: [
    "live basketball",
    "NBA live scores",
    "real-time scores",
    "live games",
    "basketball tonight",
  ],
  openGraph: {
    title: "Live Scores | BASKTBALL",
    description:
      "Real-time NBA, WNBA, and NCAA basketball scores and live game updates.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Live Basketball Scores",
  description:
    "Real-time NBA, WNBA, and NCAA basketball scores, play-by-play updates, and live game tracking.",
  url: "https://basktball.com/live",
  isPartOf: { "@type": "WebSite", name: "BASKTBALL", url: "https://basktball.com" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {children}
    </>
  );
}
