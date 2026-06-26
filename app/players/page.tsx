import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { Header, Footer, FAQ } from "@/components";
import PlayersSearchClient, { type PlayerCardData } from "./PlayersSearchClient";

export const revalidate = 3600;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://basktball.com";

export const metadata: Metadata = {
  title: "Basketball Player Search — NBA, WNBA & College Stats",
  description:
    "Search thousands of basketball players across the NBA, WNBA, NCAA and international leagues. View season averages, advanced analytics, team, position and physical stats.",
  alternates: { canonical: "/players" },
  openGraph: {
    title: "Basketball Player Search — NBA, WNBA & College Stats",
    description:
      "Search thousands of basketball players and view real-time stats, season averages and advanced analytics.",
    url: `${BASE_URL}/players`,
    type: "website",
  },
};

const PLAYERS_FAQ = [
  {
    question: "How do I search for a basketball player?",
    answer: "Type at least 2 characters of a player's name in the search bar above. Results update automatically as you type, showing matching players from the NBA, WNBA, and other leagues with their team, position, and physical stats.",
  },
  {
    question: "What player statistics are available on BASKTBALL?",
    answer: "Each player profile includes season averages for points, rebounds, assists, steals, blocks, field goal percentage, three-point percentage, and free throw percentage. Career totals and game logs are also available for most NBA and WNBA players.",
  },
  {
    question: "Does BASKTBALL cover international basketball players?",
    answer: "Yes, BASKTBALL tracks players from the NBA, WNBA, NCAA Men's and Women's basketball, EuroLeague, and other international leagues. Our database includes thousands of players across all major basketball competitions worldwide.",
  },
];

async function getPopularPlayers(): Promise<PlayerCardData[]> {
  try {
    const players = await prisma.player.findMany({
      where: { isActive: true, teamId: { not: null }, headshotUrl: { not: null } },
      select: {
        id: true,
        name: true,
        position: true,
        height: true,
        weight: true,
        jerseyNum: true,
        headshotUrl: true,
        team: { select: { id: true, name: true, abbreviation: true } },
      },
      orderBy: { name: "asc" },
      take: 24,
    });

    return players.map((p) => ({
      id: p.id,
      name: p.name,
      position: p.position || undefined,
      height: p.height || undefined,
      weight: p.weight != null ? `${p.weight} lbs` : undefined,
      jerseyNumber: p.jerseyNum != null ? String(p.jerseyNum) : undefined,
      headshotUrl: p.headshotUrl || undefined,
      team: p.team
        ? { id: p.team.id, name: p.team.name, abbreviation: p.team.abbreviation }
        : undefined,
    }));
  } catch (error) {
    console.error("Players page: failed to load popular players:", error);
    return [];
  }
}

export default async function PlayersPage() {
  const popularPlayers = await getPopularPlayers();

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Basketball Players",
    description:
      "Browse and search basketball players across the NBA, WNBA, NCAA and international leagues.",
    url: `${BASE_URL}/players`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: popularPlayers.length,
      itemListElement: popularPlayers.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${BASE_URL}/player/${p.id}`,
        name: p.name,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />

      <Header />
      <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {/* Page Header */}
          <h1 style={{
            fontFamily: "var(--font-anton), Anton, sans-serif",
            fontSize: "48px",
            marginBottom: "40px",
            textAlign: "center",
          }}>
            PLAYER SEARCH
            <span style={{
              display: "block",
              width: "100px",
              height: "4px",
              background: "var(--orange)",
              margin: "15px auto 0",
            }}></span>
          </h1>

          <PlayersSearchClient initialPlayers={popularPlayers} />

          <FAQ items={PLAYERS_FAQ} />
        </div>
      </main>
      <Footer />
    </>
  );
}
