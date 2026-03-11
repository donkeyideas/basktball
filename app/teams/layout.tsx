import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Teams",
  description:
    "Browse all NBA, WNBA, and NCAA basketball teams. Rosters, team stats, schedules, and franchise information for every team.",
  keywords: [
    "NBA teams",
    "basketball teams",
    "team rosters",
    "WNBA teams",
    "NCAA teams",
    "team stats",
  ],
  openGraph: {
    title: "Teams | BASKTBALL",
    description:
      "Browse all NBA, WNBA, and NCAA basketball teams with rosters, stats, and schedules.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Basketball Teams",
  description:
    "Browse all NBA, WNBA, and NCAA basketball teams with rosters, stats, and franchise information.",
  url: "https://basktball.com/teams",
  isPartOf: { "@id": "https://basktball.com/#website" },
  mainEntity: {
    "@type": "ItemList",
    itemListElement: { "@type": "SportsTeam", name: "NBA Teams", sport: "Basketball" },
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://basktball.com" },
    { "@type": "ListItem", position: 2, name: "Teams", item: "https://basktball.com/teams" },
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
