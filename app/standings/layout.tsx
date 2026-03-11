import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Standings",
  description:
    "Current NBA, WNBA, and NCAA basketball standings. Conference rankings, division standings, win-loss records, and playoff picture.",
  keywords: [
    "NBA standings",
    "basketball standings",
    "conference standings",
    "playoff standings",
    "NBA rankings",
    "win loss records",
  ],
  openGraph: {
    title: "Standings | BASKTBALL",
    description:
      "Current NBA, WNBA, and NCAA basketball standings and conference rankings.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Basketball Standings",
  description:
    "Current NBA, WNBA, and NCAA basketball standings with conference rankings, division standings, and playoff picture.",
  url: "https://basktball.com/standings",
  isPartOf: { "@id": "https://basktball.com/#website" },
  mainEntity: {
    "@type": "ItemList",
    name: "Basketball League Standings",
    itemListOrder: "https://schema.org/ItemListOrderDescending",
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://basktball.com" },
    { "@type": "ListItem", position: 2, name: "Standings", item: "https://basktball.com/standings" },
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
