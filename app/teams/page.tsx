import type { Metadata } from "next";
import { basketballApi } from "@/lib/api";
import TeamsClient from "./TeamsClient";

export const revalidate = 3600;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://basktball.com";

export const metadata: Metadata = {
  title: "Basketball Teams — NBA, WNBA & College",
  description:
    "Browse all NBA, WNBA, and NCAA men's and women's basketball teams. View rosters, standings, schedules and performance analytics for every team.",
  alternates: { canonical: "/teams" },
  openGraph: {
    title: "Basketball Teams — NBA, WNBA & College",
    description:
      "Browse every NBA, WNBA and NCAA basketball team with rosters, standings, schedules and analytics.",
    url: `${BASE_URL}/teams`,
    type: "website",
  },
};

async function getGroupedTeams(): Promise<Record<string, Awaited<ReturnType<typeof basketballApi.getTeamsByLeague>>>> {
  try {
    return await basketballApi.getTeamsGrouped();
  } catch (error) {
    console.error("Teams page: failed to load teams:", error);
    return {} as Record<string, never[]>;
  }
}

export default async function TeamsPage() {
  const initialTeams = await getGroupedTeams();

  const nbaTeams = initialTeams["nba"] || [];
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Basketball Teams",
    description: "Browse NBA, WNBA and NCAA basketball teams.",
    url: `${BASE_URL}/teams`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: nbaTeams.length,
      itemListElement: nbaTeams.map((t, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "SportsTeam",
          name: t.name,
          url: `${BASE_URL}/teams/nba/${t.id}`,
          ...(t.logoUrl && { logo: t.logoUrl }),
        },
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <TeamsClient initialTeams={initialTeams} />
    </>
  );
}
