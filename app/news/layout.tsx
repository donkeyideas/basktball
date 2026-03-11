import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "News & Insights",
  description:
    "Latest NBA news, AI-powered analysis, and basketball insights. Game recaps, trade rumors, player updates, and in-depth articles.",
  keywords: [
    "NBA news",
    "basketball news",
    "NBA analysis",
    "game recaps",
    "trade rumors",
    "basketball insights",
  ],
  openGraph: {
    title: "News & Insights | BASKTBALL",
    description:
      "Latest NBA news, AI-powered analysis, and basketball insights.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Basketball News & Insights",
  description:
    "Latest NBA news, AI-powered analysis, game recaps, trade rumors, and in-depth basketball articles.",
  url: "https://basktball.com/news",
  isPartOf: { "@id": "https://basktball.com/#website" },
  mainEntity: {
    "@type": "ItemList",
    itemListElement: { "@type": "NewsArticle", name: "Basketball News Articles" },
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://basktball.com" },
    { "@type": "ListItem", position: 2, name: "News", item: "https://basktball.com/news" },
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
