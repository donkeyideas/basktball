import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Draft",
  description:
    "NBA Draft analysis and prospect rankings. Scouting reports, mock drafts, combine stats, and draft prospect comparisons.",
  keywords: [
    "NBA draft",
    "draft prospects",
    "mock draft",
    "scouting reports",
    "draft rankings",
    "NBA draft picks",
  ],
  openGraph: {
    title: "Draft | BASKTBALL",
    description:
      "NBA Draft analysis with prospect rankings, scouting reports, and mock drafts.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "NBA Draft Analysis",
  description:
    "NBA Draft prospect rankings, scouting reports, mock drafts, and draft prospect comparisons.",
  url: "https://basktball.com/tools/draft",
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
