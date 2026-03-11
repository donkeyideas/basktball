import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Advanced Metrics",
  description:
    "Advanced NBA analytics and metrics. PER, true shooting percentage, usage rate, offensive/defensive ratings, and efficiency stats.",
  keywords: [
    "advanced metrics",
    "NBA analytics",
    "PER",
    "true shooting",
    "usage rate",
    "efficiency rating",
    "basketball advanced stats",
  ],
  openGraph: {
    title: "Advanced Metrics | BASKTBALL",
    description:
      "Advanced NBA analytics: PER, true shooting, usage rate, and efficiency stats.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "NBA Advanced Metrics Tool",
  description:
    "Advanced NBA analytics including PER, true shooting percentage, usage rate, and efficiency ratings.",
  url: "https://basktball.com/tools/metrics",
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
