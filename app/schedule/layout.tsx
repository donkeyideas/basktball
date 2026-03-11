import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Schedule",
  description:
    "Complete NBA, WNBA, and NCAA basketball schedule. Upcoming games, tipoff times, matchups, and broadcast information.",
  keywords: [
    "NBA schedule",
    "basketball schedule",
    "upcoming games",
    "NBA games today",
    "game times",
    "basketball calendar",
  ],
  openGraph: {
    title: "Schedule | BASKTBALL",
    description:
      "Complete NBA, WNBA, and NCAA basketball schedule with upcoming games and tipoff times.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Basketball Schedule",
  description:
    "Complete NBA, WNBA, and NCAA basketball schedule with upcoming games, tipoff times, and matchups.",
  url: "https://basktball.com/schedule",
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
