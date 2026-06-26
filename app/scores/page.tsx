import type { Metadata } from "next";
import { Header, Footer } from "@/components";
import { basketballApi } from "@/lib/api";
import ScoresClient, { type Game } from "./ScoresClient";

// Revalidate the SSR scores snapshot every 30s (matches the games API cadence)
export const revalidate = 30;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://basktball.com";

export const metadata: Metadata = {
  title: "Live Basketball Scores — NBA, WNBA & NCAA",
  description:
    "Live basketball scores updated in real-time. Track NBA, WNBA, and NCAA games with box scores, live updates and final results.",
  alternates: { canonical: "/scores" },
  openGraph: {
    title: "Live Basketball Scores — NBA, WNBA & NCAA",
    description:
      "Live basketball scores updated in real-time. Track NBA, WNBA and NCAA games with box scores and final results.",
    url: `${BASE_URL}/scores`,
    type: "website",
  },
};

async function getTodaysNbaGames(): Promise<Game[]> {
  try {
    // No date → ESPN returns today's slate (avoids UTC drift)
    const games = await basketballApi.getGames("nba");
    return games.map((g) => ({
      id: g.id,
      homeTeam: {
        id: g.homeTeam.id,
        name: g.homeTeam.name,
        abbreviation: g.homeTeam.abbreviation,
        logoUrl: g.homeTeam.logoUrl || "",
      },
      awayTeam: {
        id: g.awayTeam.id,
        name: g.awayTeam.name,
        abbreviation: g.awayTeam.abbreviation,
        logoUrl: g.awayTeam.logoUrl || "",
      },
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      status: g.status,
      quarter: g.quarter,
      clock: g.clock,
      gameDate: g.gameDate instanceof Date ? g.gameDate.toISOString() : String(g.gameDate),
      broadcast: g.broadcast,
    }));
  } catch (error) {
    console.error("Scores page: failed to load today's games:", error);
    return [];
  }
}

export default async function ScoresPage() {
  const games = await getTodaysNbaGames();

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Live Basketball Scores",
    description:
      "Real-time NBA, WNBA and NCAA basketball scores with box scores and final results.",
    url: `${BASE_URL}/scores`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: games.length,
      itemListElement: games.map((g, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "SportsEvent",
          name: `${g.awayTeam.name} @ ${g.homeTeam.name}`,
          url: `${BASE_URL}/game/${g.id}`,
          startDate: g.gameDate,
          ...(g.status === "final" && {
            homeTeam: { "@type": "SportsTeam", name: g.homeTeam.name },
            awayTeam: { "@type": "SportsTeam", name: g.awayTeam.name },
          }),
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

      <Header />
      <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {/* Page Title */}
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h1 style={{
              fontFamily: "var(--font-anton), Anton, sans-serif",
              fontSize: "48px",
              margin: 0,
              color: "var(--white)",
            }}>
              SCORES
              <span style={{
                display: "block",
                width: "100px",
                height: "4px",
                background: "var(--orange)",
                margin: "15px auto 0",
              }}></span>
            </h1>
            <p style={{
              color: "var(--text-muted)",
              fontSize: "15px",
              maxWidth: "650px",
              margin: "16px auto 0",
              lineHeight: "1.5",
            }}>
              Live basketball scores updated in real-time. Track NBA, WNBA, and NCAA games with box scores and final results.
            </p>
          </div>

          <ScoresClient initialGames={games} />
        </div>
      </main>
      <Footer />
    </>
  );
}
