"use client";

import { cn } from "@/lib/utils";

// Types
interface Team {
  id: string;
  name: string;
  abbreviation: string;
  logoUrl?: string;
  score: number;
}

interface GameStats {
  label: string;
  value: string;
}

export interface Game {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  status: "live" | "final" | "scheduled";
  quarter?: string;
  clock?: string;
  stats: GameStats[];
}

interface LiveScoresProps {
  games: Game[];
  isLoading?: boolean;
}

// Mock data for demonstration
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

function GameCard({ game }: { game: Game }) {
  const isLive = game.status === "live";

  return (
    <div className="game-card">
      {/* Live Badge */}
      {isLive && (
        <div className="absolute -top-px -right-px bg-[var(--orange)] px-4 py-1 text-xs font-bold tracking-widest animate-blink">
          LIVE
        </div>
      )}

      {/* Matchup */}
      <div className="flex items-center justify-between mb-4">
        {/* Home Team */}
        <div className="text-center flex-1">
          <div
            className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-3 bg-contain bg-center bg-no-repeat transition-transform hover:scale-110"
            style={{ backgroundImage: `url('${game.homeTeam.logoUrl}')` }}
          />
          <div className="font-bold text-base tracking-wider uppercase mb-2">
            {game.homeTeam.name}
          </div>
          <div
            className={cn(
              "font-[family-name:var(--font-roboto-mono)] text-4xl font-bold text-[var(--orange)]",
              isLive && "animate-score"
            )}
          >
            {game.homeTeam.score}
          </div>
        </div>

        {/* VS */}
        <div className="font-[family-name:var(--font-anton)] text-2xl text-white/30 px-4">
          VS
        </div>

        {/* Away Team */}
        <div className="text-center flex-1">
          <div
            className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-3 bg-contain bg-center bg-no-repeat transition-transform hover:scale-110"
            style={{ backgroundImage: `url('${game.awayTeam.logoUrl}')` }}
          />
          <div className="font-bold text-base tracking-wider uppercase mb-2">
            {game.awayTeam.name}
          </div>
          <div
            className={cn(
              "font-[family-name:var(--font-roboto-mono)] text-4xl font-bold text-[var(--orange)]",
              isLive && "animate-score"
            )}
          >
            {game.awayTeam.score}
          </div>
        </div>
      </div>

      {/* Game Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 mt-4 border-t border-white/10">
        {game.stats.map((stat, index) => (
          <div key={index} className="text-center">
            <div className="text-xs uppercase tracking-wider text-white/60 mb-1">
              {stat.label}
            </div>
            <div className="font-[family-name:var(--font-roboto-mono)] text-xl font-bold text-[var(--orange)]">
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="game-card animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="text-center flex-1">
          <div className="w-16 h-16 mx-auto mb-3 bg-white/10 rounded-full" />
          <div className="h-4 w-16 mx-auto bg-white/10 rounded mb-2" />
          <div className="h-10 w-16 mx-auto bg-white/10 rounded" />
        </div>
        <div className="w-10 h-6 bg-white/10 rounded" />
        <div className="text-center flex-1">
          <div className="w-16 h-16 mx-auto mb-3 bg-white/10 rounded-full" />
          <div className="h-4 w-16 mx-auto bg-white/10 rounded mb-2" />
          <div className="h-10 w-16 mx-auto bg-white/10 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 pt-4 mt-4 border-t border-white/10">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center">
            <div className="h-3 w-10 mx-auto bg-white/10 rounded mb-1" />
            <div className="h-6 w-12 mx-auto bg-white/10 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function LiveScores({ games = mockGames, isLoading = false }: LiveScoresProps) {
  const liveGames = games.filter((g) => g.status === "live");

  return (
    <div className="live-scores">
      {/* Header */}
      <div className="score-header">
        {liveGames.length > 0 && (
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
        )}
        <h3 className="font-[family-name:var(--font-anton)] text-2xl tracking-wider uppercase">
          {liveGames.length > 0 ? "LIVE SCORES" : "TODAY'S GAMES"}
        </h3>
      </div>

      {/* Games Grid */}
      <div className="games-grid">
        {isLoading ? (
          <>
            <LoadingSkeleton />
            <LoadingSkeleton />
            <LoadingSkeleton />
          </>
        ) : games.length > 0 ? (
          games.map((game) => <GameCard key={game.id} game={game} />)
        ) : (
          <div className="col-span-full text-center py-12 text-white/60">
            <p className="text-lg">No games scheduled</p>
          </div>
        )}
      </div>
    </div>
  );
}
