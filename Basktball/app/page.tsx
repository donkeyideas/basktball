"use client";

import { useState } from "react";
import { Header, Footer } from "@/components/layout";
import { LeagueSelector, type League } from "@/components/LeagueSelector";
import { LiveScores } from "@/components/live-scores";
import { FeaturedPlayers } from "@/components/FeaturedPlayers";
import { ToolsGrid } from "@/components/ToolsGrid";
import { HeaderBanner, InContentAd, FooterBanner } from "@/components/ads";
import { useGames } from "@/hooks";

export default function HomePage() {
  const [selectedLeague, setSelectedLeague] = useState<League>("nba");

  // Fetch real game data
  const { games, isLoading } = useGames({
    league: selectedLeague,
    refreshInterval: 30000, // Refresh every 30 seconds
  });

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
