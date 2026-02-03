"use client";

import { useState } from "react";
import {
  Header,
  Footer,
  Hero,
  LeagueSelector,
  LiveScores,
  FeaturedPlayers,
  ToolsGrid,
} from "@/components";

type League = "nba" | "wnba" | "ncaam" | "ncaaw" | "euro" | "intl";

export default function HomePage() {
  const [selectedLeague, setSelectedLeague] = useState<League>("nba");

  return (
    <>
      <Header />
      <main>
        <Hero />
        <LeagueSelector
          defaultLeague={selectedLeague}
          onLeagueChange={(league) => setSelectedLeague(league as League)}
        />
        <LiveScores league={selectedLeague} />
        <FeaturedPlayers />
        <ToolsGrid />
      </main>
      <Footer />
    </>
  );
}
