import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scores",
  description:
    "Live and recent NBA, WNBA, and NCAA basketball scores. Follow every game with real-time updates, box scores, and final results.",
  keywords: [
    "basketball scores",
    "NBA scores",
    "live scores",
    "WNBA scores",
    "NCAA scores",
    "box scores",
  ],
  openGraph: {
    title: "Scores | BASKTBALL",
    description:
      "Live and recent NBA, WNBA, and NCAA basketball scores with real-time updates.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Basketball Scores",
  description:
    "Live and recent NBA, WNBA, and NCAA basketball scores with real-time updates, box scores, and final results.",
  url: "https://basktball.com/scores",
  isPartOf: { "@id": "https://basktball.com/#website" },
  about: { "@type": "SportsOrganization", name: "NBA", sport: "Basketball" },
  mainEntity: {
    "@type": "ItemList",
    itemListElement: { "@type": "SportsEvent", name: "Basketball Game Scores", sport: "Basketball" },
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://basktball.com" },
    { "@type": "ListItem", position: 2, name: "Scores", item: "https://basktball.com/scores" },
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
