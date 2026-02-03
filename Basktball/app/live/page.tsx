"use client";

import { useState } from "react";
import { Header, Footer } from "@/components/layout";
import { LiveScores } from "@/components/live-scores";
import { LeagueSelector, type League } from "@/components/LeagueSelector";
import { useGames } from "@/hooks";

export default function LivePage() {
  const [selectedLeague, setSelectedLeague] = useState<League>("nba");

  const { games, isLoading } = useGames({
    league: selectedLeague,
    refreshInterval: 30000,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header liveGamesCount={games.filter((g) => g.status === "live").length} />

      <main className="flex-1 bg-[var(--black)]">
        {/* League Selector */}
        <div className="mb-8 md:mb-12">
          <LeagueSelector
            selectedLeague={selectedLeague}
            onLeagueChange={setSelectedLeague}
          />
        </div>

        {/* Live Scores */}
        <section className="py-12 md:py-16">
          <div className="container-main">
            <LiveScores games={games} isLoading={isLoading} />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
