import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Court",
  description:
    "The Court is where basketball talk lives. Share your takes, react to hot debates, and join the conversation on NBA games, trades, and player performances.",
  keywords: [
    "basketball social feed",
    "NBA takes",
    "basketball community",
    "NBA discussion",
    "basketball opinions",
    "game reactions",
    "NBA hot takes",
  ],
  openGraph: {
    title: "The Court | BASKTBALL",
    description:
      "The Court is where basketball talk lives. Share your takes, react to hot debates, and join the conversation.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "The Court - BASKTBALL Social Feed",
  description:
    "The Court is where basketball talk lives. Share your takes, react to hot debates, and join the conversation on NBA games, trades, and player performances.",
  url: "https://basktball.com/court",
  isPartOf: { "@id": "https://basktball.com/#website" },
  about: { "@type": "SportsOrganization", name: "NBA", sport: "Basketball" },
  potentialAction: {
    "@type": "CreateAction",
    name: "Post a Take",
    target: "https://basktball.com/court",
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://basktball.com" },
    { "@type": "ListItem", position: 2, name: "The Court", item: "https://basktball.com/court" },
  ],
};

export default function CourtLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {children}
    </>
  );
}
