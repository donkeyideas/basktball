import type { Metadata } from "next";
import { getStatLeaders } from "@/lib/stats/leaders";
import StatsClient from "./StatsClient";

export const revalidate = 300;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://basktball.com";

export const metadata: Metadata = {
  title: "NBA Stat Leaders — Points, Rebounds, Assists & More",
  description:
    "Current NBA stat leaders ranked by points, rebounds, assists, steals, blocks, field goal percentage and three-point percentage. Per-game averages updated daily.",
  alternates: { canonical: "/stats" },
  openGraph: {
    title: "NBA Stat Leaders — Points, Rebounds, Assists & More",
    description:
      "Current NBA stat leaders by points, rebounds, assists, steals, blocks and shooting percentages.",
    url: `${BASE_URL}/stats`,
    type: "website",
  },
};

export default async function StatsPage() {
  let initialLeaders: Awaited<ReturnType<typeof getStatLeaders>>["leaders"] = [];
  try {
    const result = await getStatLeaders("ppg", 25);
    initialLeaders = result.leaders;
  } catch (error) {
    console.error("Stats page: failed to load leaders:", error);
  }

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "NBA Points Per Game Leaders",
    description: "NBA players ranked by points per game this season.",
    url: `${BASE_URL}/stats`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: initialLeaders.length,
      itemListElement: initialLeaders.map((l) => ({
        "@type": "ListItem",
        position: l.rank,
        url: `${BASE_URL}/player/${l.playerId}`,
        name: l.name,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <StatsClient initialLeaders={initialLeaders} initialCategory="ppg" />
    </>
  );
}
