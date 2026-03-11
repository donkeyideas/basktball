import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team Analytics",
  description:
    "In-depth NBA team analytics. Offensive and defensive ratings, pace, net rating, team shooting splits, and performance trends.",
  keywords: [
    "team analytics",
    "NBA team stats",
    "offensive rating",
    "defensive rating",
    "team performance",
    "basketball team analysis",
  ],
  openGraph: {
    title: "Team Analytics | BASKTBALL",
    description:
      "In-depth NBA team analytics with offensive/defensive ratings and performance trends.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "NBA Team Analytics",
  description:
    "In-depth NBA team analytics with offensive/defensive ratings, pace, net rating, and performance trends.",
  url: "https://basktball.com/tools/team-analytics",
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
