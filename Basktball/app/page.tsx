"use client";

import { useState } from "react";
import { Header, Footer } from "@/components/layout";
import { LeagueSelector, type League } from "@/components/LeagueSelector";
import { LiveScores, type Game } from "@/components/live-scores";
import { FeaturedPlayers } from "@/components/FeaturedPlayers";
import { ToolsGrid } from "@/components/ToolsGrid";
import { HeaderBanner, InContentAd, FooterBanner } from "@/components/ads";
import { useGames } from "@/hooks";

// Fallback mock data when API has no games
const mockGames: Game[] = [
  {
    id: "1",
    homeTeam: {
      id: "lal",
      name: "Lakers",
      abbreviation: "LAL",
      logoUrl: "https://cdn.nba.com/logos/nba/1610612747/primary/L/logo.svg",
      score: 108,
    },
    awayTeam: {
      id: "gsw",
      name: "Warriors",
      abbreviation: "GSW",
      logoUrl: "https://cdn.nba.com/logos/nba/1610612744/primary/L/logo.svg",
      score: 112,
    },
    status: "live",
    quarter: "Q4",
    clock: "3:42",
    stats: [
      { label: "Q4", value: "3:42" },
      { label: "Lead", value: "GSW" },
      { label: "FG%", value: "48%" },
    ],
  },
  {
    id: "2",
    homeTeam: {
      id: "bos",
      name: "Celtics",
      abbreviation: "BOS",
      logoUrl: "https://cdn.nba.com/logos/nba/1610612738/primary/L/logo.svg",
      score: 95,
    },
    awayTeam: {
      id: "mia",
      name: "Heat",
      abbreviation: "MIA",
      logoUrl: "https://cdn.nba.com/logos/nba/1610612748/primary/L/logo.svg",
      score: 89,
    },
    status: "live",
    quarter: "Q3",
    clock: "8:15",
    stats: [
      { label: "Q3", value: "8:15" },
      { label: "Lead", value: "BOS" },
      { label: "FG%", value: "52%" },
    ],
  },
  {
    id: "3",
    homeTeam: {
      id: "den",
      name: "Nuggets",
      abbreviation: "DEN",
      logoUrl: "https://cdn.nba.com/logos/nba/1610612743/primary/L/logo.svg",
      score: 121,
    },
    awayTeam: {
      id: "phx",
      name: "Suns",
      abbreviation: "PHX",
      logoUrl: "https://cdn.nba.com/logos/nba/1610612756/primary/L/logo.svg",
      score: 118,
    },
    status: "final",
    stats: [
      { label: "Final", value: "OT" },
      { label: "Top", value: "DEN" },
      { label: "3PT", value: "15" },
    ],
  },
];

export default function HomePage() {
  const [selectedLeague, setSelectedLeague] = useState<League>("nba");

  // Fetch real game data
  const { games: apiGames, isLoading } = useGames({
    league: selectedLeague,
    refreshInterval: 30000, // Refresh every 30 seconds
  });

  // Use API data if available, otherwise fall back to mock data
  const games = apiGames.length > 0 ? apiGames : mockGames;
  const liveGamesCount = games.filter((g) => g.status === "live").length;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <Header liveGamesCount={liveGamesCount} />

      {/* Header Banner Ad */}
      <HeaderBanner />

      {/* Main Content */}
      <main className="flex-1">
        {/* League Selector */}
        <div className="mb-8 md:mb-12">
          <LeagueSelector
            selectedLeague={selectedLeague}
            onLeagueChange={setSelectedLeague}
          />
        </div>

        {/* Live Scores Section */}
        <section className="bg-[var(--black)] py-12 md:py-16 mb-8 md:mb-12">
          <div className="container-main">
            <LiveScores games={games} isLoading={isLoading} />
          </div>
        </section>

        {/* In-Content Ad */}
        <InContentAd />

        {/* Featured Players - Full Width */}
        <div className="mb-8 md:mb-12">
          <FeaturedPlayers />
        </div>

        {/* Analytics Tools */}
        <section className="bg-[var(--black)] py-12 md:py-16 mb-8 md:mb-12">
          <div className="container-main">
            <ToolsGrid />
          </div>
        </section>
      </main>

      {/* Footer Banner Ad */}
      <FooterBanner />

      {/* Footer */}
      <Footer />
    </div>
  );
}
