"use client";

import { useState } from "react";
import { Header, Footer } from "@/components/layout";
import { Hero } from "@/components/Hero";
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
        {/* Hero Section */}
        <Hero />

        {/* League Selector */}
        <LeagueSelector
          selectedLeague={selectedLeague}
          onLeagueChange={setSelectedLeague}
        />

        {/* Live Scores Section */}
        <section className="stats-section">
          <LiveScores games={games} isLoading={isLoading} />
        </section>

        {/* In-Content Ad */}
        <InContentAd />

        {/* Featured Players - Full Width */}
        <FeaturedPlayers />

        {/* Analytics Tools */}
        <section className="stats-section">
          <ToolsGrid />
        </section>
      </main>

      {/* Footer Banner Ad */}
      <FooterBanner />

      {/* Footer */}
      <Footer />
    </div>
  );
}
