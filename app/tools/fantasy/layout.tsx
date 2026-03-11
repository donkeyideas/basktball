import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fantasy Basketball",
  description:
    "Fantasy basketball tools and projections. Player rankings, start/sit advice, waiver wire recommendations, and matchup analysis.",
  keywords: [
    "fantasy basketball",
    "fantasy NBA",
    "player rankings",
    "start sit",
    "waiver wire",
    "fantasy projections",
  ],
  openGraph: {
    title: "Fantasy Basketball | BASKTBALL",
    description:
      "Fantasy basketball tools with player rankings, projections, and start/sit advice.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Fantasy Basketball Tools",
  description:
    "Fantasy basketball player rankings, start/sit advice, waiver wire recommendations, and matchup analysis.",
  url: "https://basktball.com/tools/fantasy",
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
