"use client";

import { useState, useEffect, useCallback } from "react";

export type League = "nba" | "wnba" | "ncaam" | "ncaaw" | "euro" | "intl";

export interface GameTeam {
  id: string;
  name: string;
  abbreviation: string;
  logoUrl: string;
  score: number;
}

export interface GameStat {
  label: string;
  value: string;
}

export interface Game {
  id: string;
  homeTeam: GameTeam;
  awayTeam: GameTeam;
  status: "scheduled" | "live" | "final";
  quarter?: string;
  clock?: string;
  stats: GameStat[];
}

interface UseGamesOptions {
  league?: League;
  refreshInterval?: number; // in milliseconds
  enabled?: boolean;
}

interface UseGamesResult {
  games: Game[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

// Transform API response to component format
function transformGame(apiGame: {
  id: string;
  homeTeam: {
    id: string;
    name: string;
    abbreviation: string;
    logoUrl: string;
  };
  awayTeam: {
    id: string;
    name: string;
    abbreviation: string;
    logoUrl: string;
  };
  homeScore: number;
  awayScore: number;
  status: "scheduled" | "live" | "final";
  quarter?: string;
  clock?: string;
}): Game {
  const stats = [];

  if (apiGame.status === "live" && apiGame.quarter) {
    stats.push({ label: apiGame.quarter, value: apiGame.clock || "" });
    const leader = apiGame.homeScore > apiGame.awayScore
      ? apiGame.homeTeam.abbreviation
      : apiGame.awayScore > apiGame.homeScore
        ? apiGame.awayTeam.abbreviation
        : "TIE";
    stats.push({ label: "Lead", value: leader });
  } else if (apiGame.status === "final") {
    stats.push({ label: "Final", value: "" });
    const winner = apiGame.homeScore > apiGame.awayScore
      ? apiGame.homeTeam.abbreviation
      : apiGame.awayTeam.abbreviation;
    stats.push({ label: "Winner", value: winner });
  } else {
    stats.push({ label: "Scheduled", value: "" });
  }

  return {
    id: apiGame.id,
    homeTeam: {
      id: apiGame.homeTeam.id,
      name: apiGame.homeTeam.name,
      abbreviation: apiGame.homeTeam.abbreviation,
      logoUrl: apiGame.homeTeam.logoUrl,
      score: apiGame.homeScore,
    },
    awayTeam: {
      id: apiGame.awayTeam.id,
      name: apiGame.awayTeam.name,
      abbreviation: apiGame.awayTeam.abbreviation,
      logoUrl: apiGame.awayTeam.logoUrl,
      score: apiGame.awayScore,
    },
    status: apiGame.status,
    quarter: apiGame.quarter,
    clock: apiGame.clock,
    stats,
  };
}

export function useGames({
  league = "nba",
  refreshInterval = 30000, // Default 30 seconds
  enabled = true,
}: UseGamesOptions = {}): UseGamesResult {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchGames = useCallback(async () => {
    if (!enabled) return;

    try {
      const response = await fetch(`/api/games?league=${league}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch games: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.games) {
        const transformedGames = data.games.map(transformGame);
        setGames(transformedGames);
        setError(null);
        setLastUpdated(new Date());
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch games"));
    } finally {
      setIsLoading(false);
    }
  }, [league, enabled]);

  // Initial fetch
  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  // Auto-refresh
  useEffect(() => {
    if (!enabled || refreshInterval <= 0) return;

    const interval = setInterval(fetchGames, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchGames, refreshInterval, enabled]);

  return {
    games,
    isLoading,
    error,
    refetch: fetchGames,
    lastUpdated,
  };
}

export default useGames;
