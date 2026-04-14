import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import PlayerClient from "./PlayerClient";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://basktball.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const player = await prisma.player.findUnique({
      where: { id },
      select: {
        name: true,
        position: true,
        height: true,
        weight: true,
        country: true,
        headshotUrl: true,
        team: { select: { name: true } },
      },
    });

    if (!player) {
      return {
        title: "Player Not Found",
        description: "The requested player could not be found.",
      };
    }

    const title = `${player.name} Stats & Analytics`;
    const positionStr = player.position ? ` (${player.position})` : "";
    const teamStr = player.team ? ` - ${player.team.name}` : "";
    const description = `${player.name}${positionStr}${teamStr} - Real-time stats, season averages, and advanced analytics.`;
    const canonicalUrl = `${BASE_URL}/player/${id}`;
    const headshotUrl =
      player.headshotUrl ||
      `https://cdn.nba.com/headshots/nba/latest/1040x760/${id}.png`;

    return {
      title,
      description,
      alternates: {
        canonical: `/player/${id}`,
      },
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        type: "profile",
        images: [
          {
            url: headshotUrl,
            width: 1040,
            height: 760,
            alt: `${player.name} headshot`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [headshotUrl],
      },
    };
  } catch {
    return {
      title: "Player Stats & Analytics",
      description:
        "View NBA player stats, season averages, and advanced analytics.",
    };
  }
}

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Check if player exists — return 404 if not
  const exists = await prisma.player.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!exists) notFound();

  // Build JSON-LD structured data
  let personJsonLd: Record<string, unknown> | null = null;
  try {
    const player = await prisma.player.findUnique({
      where: { id },
      select: {
        name: true,
        position: true,
        height: true,
        weight: true,
        country: true,
        headshotUrl: true,
        team: { select: { name: true } },
      },
    });

    if (player) {
      const headshotUrl =
        player.headshotUrl ||
        `https://cdn.nba.com/headshots/nba/latest/1040x760/${id}.png`;

      personJsonLd = {
        "@context": "https://schema.org",
        "@type": "Person",
        name: player.name,
        url: `${BASE_URL}/player/${id}`,
        image: headshotUrl,
        jobTitle: player.position
          ? `Professional Basketball Player - ${player.position}`
          : "Professional Basketball Player",
        ...(player.team && {
          affiliation: {
            "@type": "SportsTeam",
            name: player.team.name,
          },
        }),
        ...(player.country && {
          nationality: {
            "@type": "Country",
            name: player.country,
          },
        }),
        ...(player.height && { height: player.height }),
        ...(player.weight && { weight: `${player.weight} lbs` }),
      };
    }
  } catch {
    // Silently fail - page will still render without JSON-LD
  }

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
        name: "Players",
        item: `${BASE_URL}/players`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: personJsonLd ? (personJsonLd.name as string) : "Player",
        item: `${BASE_URL}/player/${id}`,
      },
    ],
  };

  return (
    <>
      {/* BreadcrumbList JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />

      {/* Person JSON-LD */}
      {personJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(personJsonLd),
          }}
        />
      )}

      <PlayerClient params={params} />
    </>
  );
}
