import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Player Compare",
  description:
    "Compare NBA players head-to-head. Side-by-side stats, career averages, shooting splits, and advanced metrics comparison.",
  keywords: [
    "player comparison",
    "NBA compare",
    "head to head",
    "player stats comparison",
    "basketball analytics",
  ],
  openGraph: {
    title: "Player Compare | BASKTBALL",
    description:
      "Compare NBA players head-to-head with side-by-side stats and advanced metrics.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "NBA Player Comparison Tool",
  description:
    "Compare NBA players head-to-head with side-by-side stats, career averages, and advanced metrics.",
  url: "https://basktball.com/tools/compare",
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
