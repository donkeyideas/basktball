import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import TeamClient from "./TeamClient";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://basktball.com";

const LEAGUE_NAMES: Record<string, string> = {
  nba: "NBA",
  wnba: "WNBA",
  ncaam: "NCAA Men's Basketball",
  ncaaw: "NCAA Women's Basketball",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ league: string; id: string }>;
}): Promise<Metadata> {
  const { league, id } = await params;

  try {
    const team = await prisma.team.findUnique({
      where: { id },
      select: {
        name: true,
        city: true,
        conference: true,
        division: true,
        logoUrl: true,
      },
    });

    if (!team) {
      return {
        title: "Team Not Found",
        description: "The requested team could not be found.",
      };
    }

    const fullName = team.city ? `${team.city} ${team.name}` : team.name;
    const leagueName = LEAGUE_NAMES[league] || league.toUpperCase();
    const title = `${fullName} - ${leagueName} Stats & Roster`;
    const description = `${fullName} (${leagueName}) - Team stats, roster, schedule, and game results.`;

    return {
      title,
      description,
      alternates: {
        canonical: `/teams/${league}/${id}`,
      },
      openGraph: {
        title,
        description,
        url: `${BASE_URL}/teams/${league}/${id}`,
        type: "profile",
        ...(team.logoUrl && {
          images: [
            {
              url: team.logoUrl,
              width: 200,
              height: 200,
              alt: `${fullName} logo`,
            },
          ],
        }),
      },
      twitter: {
        card: "summary",
        title,
        description,
        ...(team.logoUrl && { images: [team.logoUrl] }),
      },
    };
  } catch {
    return {
      title: "Team Stats & Roster",
      description: "View team stats, roster, and schedule.",
    };
  }
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ league: string; id: string }>;
}) {
  const { league, id } = await params;

  // Check if team exists — return 404 if not
  const exists = await prisma.team.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!exists) notFound();

  let sportsTeamJsonLd: Record<string, unknown> | null = null;
  try {
    const team = await prisma.team.findUnique({
      where: { id },
      select: {
        name: true,
        city: true,
        conference: true,
        division: true,
        logoUrl: true,
        league: true,
      },
    });

    if (team) {
      const fullName = team.city ? `${team.city} ${team.name}` : team.name;
      sportsTeamJsonLd = {
        "@context": "https://schema.org",
        "@type": "SportsTeam",
        name: fullName,
        url: `${BASE_URL}/teams/${league}/${id}`,
        sport: "Basketball",
        ...(team.logoUrl && { logo: team.logoUrl }),
        ...(team.conference && {
          memberOf: {
            "@type": "SportsOrganization",
            name: `${team.conference}${team.division ? ` - ${team.division}` : ""}`,
          },
        }),
        parentOrganization: {
          "@type": "SportsOrganization",
          name: LEAGUE_NAMES[league] || league.toUpperCase(),
        },
      };
    }
  } catch {
    // JSON-LD is non-critical
  }

  const leagueName = LEAGUE_NAMES[league] || league.toUpperCase();
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: BASE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Teams",
        item: `${BASE_URL}/teams`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: leagueName,
        item: `${BASE_URL}/teams?league=${league}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: sportsTeamJsonLd ? (sportsTeamJsonLd.name as string) : "Team",
        item: `${BASE_URL}/teams/${league}/${id}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />
      {sportsTeamJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(sportsTeamJsonLd),
          }}
        />
      )}
      <TeamClient />
    </>
  );
}
