"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  transformGame,
  type League,
  type Game,
  type GameTeam,
  type GameStat,
} from "@/lib/games/transform";

export type { League, Game, GameTeam, GameStat };

interface UseGamesOptions {
  league?: League;
  refreshInterval?: number; // in milliseconds
  enabled?: boolean;
  initialGames?: Game[]; // SSR-seeded games to render before the first fetch
}

interface UseGamesResult {
  games: Game[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useGames({
  league = "nba",
  refreshInterval = 30000, // Default 30 seconds
  enabled = true,
  initialGames,
}: UseGamesOptions = {}): UseGamesResult {
  const [games, setGames] = useState<Game[]>(initialGames ?? []);
  const [isLoading, setIsLoading] = useState(!initialGames);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  // Skip ONLY the very first fetch when the page already SSR'd games
  const skipFirstFetch = useRef(Boolean(initialGames));

  const fetchGames = useCallback(async () => {
    if (!enabled) return;

    try {
      let allGames: Game[] = [];

      if (league === "nba") {
        // When NBA is selected, also show WNBA games alongside
        const [nbaRes, wnbaRes] = await Promise.all([
          fetch("/api/games?league=nba"),
          fetch("/api/games?league=wnba"),
        ]);
        const [nbaData, wnbaData] = await Promise.all([nbaRes.json(), wnbaRes.json()]);

        if (nbaData.success && nbaData.games) {
          allGames.push(...nbaData.games.map(transformGame));
        }
        if (wnbaData.success && wnbaData.games) {
          allGames.push(...wnbaData.games.map(transformGame));
        }

        // Sort: live first, then scheduled, then final
        allGames.sort((a, b) => {
          const order = (g: Game) => g.status === "live" ? 0 : g.status === "scheduled" ? 1 : 2;
          return order(a) - order(b);
        });
      } else {
        const response = await fetch(`/api/games?league=${league}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch games: ${response.status}`);
        }
        const data = await response.json();
        if (data.success && data.games) {
          allGames = data.games.map(transformGame);
        } else {
          throw new Error(data.error || "Unknown error");
        }
      }

      setGames(allGames);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch games"));
    } finally {
      setIsLoading(false);
    }
  }, [league, enabled]);

  // Initial fetch (skipped exactly once if SSR-seeded)
  useEffect(() => {
    if (skipFirstFetch.current) {
      skipFirstFetch.current = false;
      return;
    }
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
