"use client";

import { useState } from "react";
import { Header, Footer } from "@/components/layout";
import { GamePrediction } from "@/components/ai";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { HeaderBanner, SidebarAds } from "@/components/ads";

interface UpcomingGame {
  id: string;
  homeTeam: {
    name: string;
    abbreviation: string;
    logoUrl: string;
    record: string;
    stats: string;
  };
  awayTeam: {
    name: string;
    abbreviation: string;
    logoUrl: string;
    record: string;
    stats: string;
  };
  time: string;
  date: string;
  spread: string;
  overUnder: string;
}

// Mock upcoming games
const mockGames: UpcomingGame[] = [
  {
    id: "1",
    homeTeam: {
      name: "Los Angeles Lakers",
      abbreviation: "LAL",
      logoUrl: "https://cdn.nba.com/logos/nba/1610612747/primary/L/logo.svg",
      record: "32-25",
      stats: "114.5 PPG, 46.2 FG%, 37.8 3P%",
    },
    awayTeam: {
      name: "Golden State Warriors",
      abbreviation: "GSW",
      logoUrl: "https://cdn.nba.com/logos/nba/1610612744/primary/L/logo.svg",
      record: "29-28",
      stats: "117.2 PPG, 47.1 FG%, 39.2 3P%",
    },
    time: "10:30 PM ET",
    date: "Tonight",
    spread: "LAL -3.5",
    overUnder: "234.5",
  },
  {
    id: "2",
    homeTeam: {
      name: "Boston Celtics",
      abbreviation: "BOS",
      logoUrl: "https://cdn.nba.com/logos/nba/1610612738/primary/L/logo.svg",
      record: "44-12",
      stats: "120.1 PPG, 48.5 FG%, 39.1 3P%",
    },
    awayTeam: {
      name: "Milwaukee Bucks",
      abbreviation: "MIL",
      logoUrl: "https://cdn.nba.com/logos/nba/1610612749/primary/L/logo.svg",
      record: "35-21",
      stats: "118.4 PPG, 47.8 FG%, 36.4 3P%",
    },
    time: "7:30 PM ET",
    date: "Tomorrow",
    spread: "BOS -5.5",
    overUnder: "238.0",
  },
  {
    id: "3",
    homeTeam: {
      name: "Denver Nuggets",
      abbreviation: "DEN",
      logoUrl: "https://cdn.nba.com/logos/nba/1610612743/primary/L/logo.svg",
      record: "39-18",
      stats: "115.8 PPG, 49.2 FG%, 38.0 3P%",
    },
    awayTeam: {
      name: "Phoenix Suns",
      abbreviation: "PHX",
      logoUrl: "https://cdn.nba.com/logos/nba/1610612756/primary/L/logo.svg",
      record: "33-24",
      stats: "116.5 PPG, 48.0 FG%, 37.5 3P%",
    },
    time: "9:00 PM ET",
    date: "Tomorrow",
    spread: "DEN -4.0",
    overUnder: "229.5",
  },
  {
    id: "4",
    homeTeam: {
      name: "Oklahoma City Thunder",
      abbreviation: "OKC",
      logoUrl: "https://cdn.nba.com/logos/nba/1610612760/primary/L/logo.svg",
      record: "41-15",
      stats: "119.3 PPG, 47.5 FG%, 37.8 3P%",
    },
    awayTeam: {
      name: "Dallas Mavericks",
      abbreviation: "DAL",
      logoUrl: "https://cdn.nba.com/logos/nba/1610612742/primary/L/logo.svg",
      record: "34-22",
      stats: "117.8 PPG, 47.0 FG%, 36.9 3P%",
    },
    time: "8:00 PM ET",
    date: "Friday",
    spread: "OKC -6.5",
    overUnder: "232.0",
  },
];

export default function PredictorPage() {
  const [selectedGame, setSelectedGame] = useState<UpcomingGame | null>(mockGames[0]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <HeaderBanner />

      <main className="flex-1 bg-[var(--black)] flex flex-col">
        {/* Hero */}
        <section className="bg-gradient-to-br from-[var(--dark-gray)] to-[var(--black)] py-6 md:py-8 border-b-4 border-[var(--orange)]">
          <div className="container-main">
            <h1 className="font-[family-name:var(--font-anton)] text-3xl md:text-4xl tracking-wider text-white mb-2">
              GAME PREDICTOR
            </h1>
            <p className="text-white/70">
              AI-powered predictions for upcoming games with confidence ratings
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className="flex-1 py-6 md:py-8 flex min-h-0">
          <div className="container-main flex-1 flex flex-col min-h-0">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8 flex-1 min-h-0">
              {/* Games List */}
              <div className="lg:col-span-1 space-y-4 flex flex-col min-h-0">
                <h2 className="font-[family-name:var(--font-anton)] text-xl tracking-wider mb-4">
                  UPCOMING GAMES
                </h2>

                {mockGames.map((game) => (
                  <Card
                    key={game.id}
                    variant={selectedGame?.id === game.id ? "bordered" : "default"}
                    hover
                    className={cn(
                      "p-4 cursor-pointer",
                      selectedGame?.id === game.id && "border-[var(--orange)]"
                    )}
                    onClick={() => setSelectedGame(game)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-[var(--orange)]">{game.date}</span>
                      <span className="text-xs text-white/50">{game.time}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={game.awayTeam.logoUrl}
                          alt={game.awayTeam.name}
                          className="w-8 h-8"
                        />
                        <div>
                          <p className="font-semibold text-sm">{game.awayTeam.abbreviation}</p>
                          <p className="text-xs text-white/50">{game.awayTeam.record}</p>
                        </div>
                      </div>

                      <span className="text-white/30">@</span>

                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="font-semibold text-sm">{game.homeTeam.abbreviation}</p>
                          <p className="text-xs text-white/50">{game.homeTeam.record}</p>
                        </div>
                        <img
                          src={game.homeTeam.logoUrl}
                          alt={game.homeTeam.name}
                          className="w-8 h-8"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between mt-3 pt-3 border-t border-white/10 text-xs text-white/50">
                      <span>Spread: {game.spread}</span>
                      <span>O/U: {game.overUnder}</span>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Prediction Panel */}
              <div className="lg:col-span-2 flex flex-col min-h-0 xl:col-span-2">
                {selectedGame ? (
                  <div className="space-y-6 flex-1 flex flex-col">
                    {/* AI Prediction Component */}
                    <GamePrediction
                      homeTeam={{
                        name: selectedGame.homeTeam.name,
                        abbreviation: selectedGame.homeTeam.abbreviation,
                        logoUrl: selectedGame.homeTeam.logoUrl,
                        record: selectedGame.homeTeam.record,
                      }}
                      awayTeam={{
                        name: selectedGame.awayTeam.name,
                        abbreviation: selectedGame.awayTeam.abbreviation,
                        logoUrl: selectedGame.awayTeam.logoUrl,
                        record: selectedGame.awayTeam.record,
                      }}
                      homeStats={selectedGame.homeTeam.stats}
                      awayStats={selectedGame.awayTeam.stats}
                    />

                    {/* Team Stats Comparison */}
                    <Card variant="default" className="p-5">
                      <h3 className="font-[family-name:var(--font-anton)] text-lg tracking-wider mb-4">
                        TEAM COMPARISON
                      </h3>

                      <div className="space-y-4">
                        {/* Away Team Stats */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <img
                              src={selectedGame.awayTeam.logoUrl}
                              alt={selectedGame.awayTeam.name}
                              className="w-6 h-6"
                            />
                            <span className="font-semibold">{selectedGame.awayTeam.name}</span>
                          </div>
                          <p className="text-sm text-white/70 pl-8">
                            {selectedGame.awayTeam.stats}
                          </p>
                        </div>

                        <div className="border-t border-white/10" />

                        {/* Home Team Stats */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <img
                              src={selectedGame.homeTeam.logoUrl}
                              alt={selectedGame.homeTeam.name}
                              className="w-6 h-6"
                            />
                            <span className="font-semibold">{selectedGame.homeTeam.name}</span>
                          </div>
                          <p className="text-sm text-white/70 pl-8">
                            {selectedGame.homeTeam.stats}
                          </p>
                        </div>
                      </div>
                    </Card>

                    {/* Betting Lines */}
                    <Card variant="bordered" className="p-5 flex-1 flex flex-col">
                      <h3 className="font-[family-name:var(--font-anton)] text-lg tracking-wider mb-4">
                        BETTING LINES
                      </h3>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[var(--black)] p-4 text-center">
                          <p className="text-xs text-white/50 mb-1">SPREAD</p>
                          <p className="font-[family-name:var(--font-roboto-mono)] text-xl font-bold text-[var(--orange)]">
                            {selectedGame.spread}
                          </p>
                        </div>
                        <div className="bg-[var(--black)] p-4 text-center">
                          <p className="text-xs text-white/50 mb-1">OVER/UNDER</p>
                          <p className="font-[family-name:var(--font-roboto-mono)] text-xl font-bold">
                            {selectedGame.overUnder}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-white/40 text-center mt-4">
                        Lines are for informational purposes only. Please gamble responsibly.
                      </p>
                    </Card>
                  </div>
                ) : (
                  <div className="flex items-center justify-center flex-1 text-white/50">
                    Select a game to view prediction
                  </div>
                )}
              </div>

              {/* Sidebar Ads */}
              <div className="hidden xl:block">
                <SidebarAds />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
