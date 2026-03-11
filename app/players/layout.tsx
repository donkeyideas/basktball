import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Players",
  description:
    "Search and explore NBA, WNBA, and NCAA basketball players. Player profiles, career stats, headshots, and performance data.",
  keywords: [
    "NBA players",
    "basketball players",
    "player profiles",
    "player stats",
    "NBA roster",
    "player search",
  ],
  openGraph: {
    title: "Players | BASKTBALL",
    description:
      "Search and explore NBA, WNBA, and NCAA basketball players with profiles and career stats.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Basketball Players",
  description:
    "Search and explore NBA, WNBA, and NCAA basketball players with profiles, career stats, and performance data.",
  url: "https://basktball.com/players",
  isPartOf: { "@id": "https://basktball.com/#website" },
  mainEntity: {
    "@type": "ItemList",
    itemListElement: { "@type": "Person", name: "Basketball Players" },
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://basktball.com" },
    { "@type": "ListItem", position: 2, name: "Players", item: "https://basktball.com/players" },
  ],
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {children}
    </>
  );
}
