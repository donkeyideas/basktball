import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Betting Analytics",
  description:
    "NBA betting analytics and odds comparison. Spread analysis, over/under trends, prop bets, and data-driven betting insights.",
  keywords: [
    "NBA betting",
    "basketball odds",
    "spread analysis",
    "over under",
    "betting analytics",
    "NBA props",
  ],
  openGraph: {
    title: "Betting Analytics | BASKTBALL",
    description:
      "NBA betting analytics with odds comparison, spread analysis, and data-driven insights.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "NBA Betting Analytics",
  description:
    "NBA betting analytics with odds comparison, spread analysis, over/under trends, and data-driven insights.",
  url: "https://basktball.com/tools/betting",
  applicationCategory: "SportsApplication",
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
