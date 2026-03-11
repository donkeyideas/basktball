import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stats",
  description:
    "Comprehensive NBA player and team statistics. Points, rebounds, assists, shooting percentages, advanced metrics, and season leaders.",
  keywords: [
    "NBA stats",
    "player statistics",
    "basketball stats",
    "season leaders",
    "advanced metrics",
    "NBA analytics",
  ],
  openGraph: {
    title: "Stats | BASKTBALL",
    description:
      "Comprehensive NBA player and team statistics, season leaders, and advanced metrics.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Basketball Statistics",
  description:
    "Comprehensive NBA player and team statistics including points, rebounds, assists, and advanced metrics.",
  url: "https://basktball.com/stats",
  isPartOf: { "@id": "https://basktball.com/#website" },
  about: { "@type": "Thing", name: "Basketball Statistics" },
  mainEntity: {
    "@type": "ItemList",
    name: "NBA Statistical Leaders",
    itemListOrder: "https://schema.org/ItemListOrderDescending",
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://basktball.com" },
    { "@type": "ListItem", position: 2, name: "Stats", item: "https://basktball.com/stats" },
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
