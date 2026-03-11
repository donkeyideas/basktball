import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shot Chart",
  description:
    "Interactive NBA shot chart tool. Visualize player shooting zones, hot spots, and field goal percentages across the court.",
  keywords: [
    "shot chart",
    "NBA shot chart",
    "shooting zones",
    "field goal percentage",
    "basketball analytics",
    "shooting heat map",
  ],
  openGraph: {
    title: "Shot Chart | BASKTBALL",
    description:
      "Interactive NBA shot chart tool with shooting zones and field goal percentages.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "NBA Shot Chart Tool",
  description:
    "Interactive shot chart tool to visualize player shooting zones, hot spots, and field goal percentages.",
  url: "https://basktball.com/tools/shot-chart",
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
