import { Metadata } from "next";
import Script from "next/script";
import { prisma } from "@/lib/db/prisma";
import GameClient from "./GameClient";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://basktball.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const game = await prisma.game.findUnique({
      where: { id },
      select: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
        gameDate: true,
        status: true,
      },
    });
    if (!game) {
      return {
        title: "Game Not Found",
        robots: { index: false, follow: false },
      };
    }

    const title = `${game.awayTeam.name} vs ${game.homeTeam.name}`;
    const dateStr = game.gameDate
      ? new Date(game.gameDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "";
    const desc = `${title}${dateStr ? ` - ${dateStr}` : ""} - Live scores, box scores, and play-by-play.`;

    return {
      title,
      description: desc,
      alternates: { canonical: `/game/${id}` },
      openGraph: { title, description: desc, type: "article" },
    };
  } catch {
    return {
      title: "Game Details",
      robots: { index: false, follow: false },
    };
  }
}

export default async function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch game data for JSON-LD structured data
  let jsonLd: object | null = null;
  let breadcrumbLd: object | null = null;

  try {
    const game = await prisma.game.findUnique({
      where: { id },
      select: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
        gameDate: true,
        status: true,
        arena: true,
        homeScore: true,
        awayScore: true,
      },
    });

    if (game) {
      const title = `${game.awayTeam.name} vs ${game.homeTeam.name}`;
      const gameUrl = `${BASE_URL}/game/${id}`;

      jsonLd = {
        "@context": "https://schema.org",
        "@type": "SportsEvent",
        name: title,
        startDate: game.gameDate ? new Date(game.gameDate).toISOString() : undefined,
        eventStatus:
          game.status === "LIVE"
            ? "https://schema.org/EventScheduled"
            : game.status === "FINAL"
              ? "https://schema.org/EventCompleted"
              : game.status === "POSTPONED"
                ? "https://schema.org/EventPostponed"
                : game.status === "CANCELLED"
                  ? "https://schema.org/EventCancelled"
                  : "https://schema.org/EventScheduled",
        homeTeam: {
          "@type": "SportsTeam",
          name: game.homeTeam.name,
        },
        awayTeam: {
          "@type": "SportsTeam",
          name: game.awayTeam.name,
        },
        location: game.arena
          ? {
              "@type": "Place",
              name: game.arena,
            }
          : undefined,
        url: gameUrl,
        ...(game.status === "FINAL" &&
          game.homeScore != null &&
          game.awayScore != null && {
            result: {
              "@type": "Result",
              description: `${game.awayTeam.name} ${game.awayScore} - ${game.homeTeam.name} ${game.homeScore}`,
            },
          }),
      };

      breadcrumbLd = {
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
            name: "Live Scores",
            item: `${BASE_URL}/live`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: title,
            item: gameUrl,
          },
        ],
      };
    }
  } catch {
    // JSON-LD is non-critical; continue rendering without it
  }

  return (
    <>
      {jsonLd && (
        <Script
          id="game-jsonld"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {breadcrumbLd && (
        <Script
          id="breadcrumb-jsonld"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />
      )}
      <GameClient params={params} />
    </>
  );
}
