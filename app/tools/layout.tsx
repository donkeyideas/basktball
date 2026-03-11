import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tools",
  description:
    "Basketball analytics tools for fans and analysts. Shot charts, player comparisons, game predictions, fantasy basketball, betting odds, draft analysis, and more.",
  keywords: [
    "basketball tools",
    "NBA analytics",
    "basketball analytics",
    "player comparison",
    "game predictor",
    "fantasy basketball",
  ],
  openGraph: {
    title: "Tools | BASKTBALL",
    description:
      "Basketball analytics tools: shot charts, comparisons, predictions, fantasy, and more.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Basketball Analytics Tools",
  description:
    "Shot charts, player comparisons, game predictions, fantasy basketball, betting odds, draft analysis, and more.",
  url: "https://basktball.com/tools",
  isPartOf: { "@id": "https://basktball.com/#website" },
  mainEntity: {
    "@type": "ItemList",
    itemListElement: [
      { "@type": "SoftwareApplication", name: "Player Comparison Tool", applicationCategory: "Sports Analytics" },
      { "@type": "SoftwareApplication", name: "Advanced Metrics", applicationCategory: "Sports Analytics" },
      { "@type": "SoftwareApplication", name: "Game Predictor", applicationCategory: "Sports Analytics" },
      { "@type": "SoftwareApplication", name: "Fantasy Optimizer", applicationCategory: "Sports Analytics" },
      { "@type": "SoftwareApplication", name: "Team Analytics", applicationCategory: "Sports Analytics" },
      { "@type": "SoftwareApplication", name: "Draft Board", applicationCategory: "Sports Analytics" },
    ],
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://basktball.com" },
    { "@type": "ListItem", position: 2, name: "Tools", item: "https://basktball.com/tools" },
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
