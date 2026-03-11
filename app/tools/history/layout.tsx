import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "History",
  description:
    "NBA history and records. All-time leaders, championship history, legendary performances, and historical basketball data.",
  keywords: [
    "NBA history",
    "basketball records",
    "all-time leaders",
    "NBA champions",
    "historical stats",
    "NBA records",
  ],
  openGraph: {
    title: "History | BASKTBALL",
    description:
      "NBA history and records: all-time leaders, championship history, and legendary performances.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "NBA History & Records",
  description:
    "NBA all-time leaders, championship history, legendary performances, and historical basketball data.",
  url: "https://basktball.com/tools/history",
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
