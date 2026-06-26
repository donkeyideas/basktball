// Server-safe game transform + fetch helpers.
// Shared by hooks/useGames.ts (client) and server components so both produce
// the identical Game shape. No "use client" — importable from server pages.

import { basketballApi } from "@/lib/api";

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
  broadcast?: string;
}

interface ApiGame {
  id: string;
  homeTeam: { id: string; name: string; abbreviation: string; logoUrl: string };
  awayTeam: { id: string; name: string; abbreviation: string; logoUrl: string };
  homeScore: number;
  awayScore: number;
  status: "scheduled" | "live" | "final";
  quarter?: string;
  clock?: string;
  gameDate?: string | Date;
  broadcast?: string;
}

// Transform a normalized API game into the component-facing Game shape
export function transformGame(apiGame: ApiGame): Game {
  const stats: GameStat[] = [];

  if (apiGame.status === "live") {
    if (apiGame.quarter) {
      stats.push({ label: apiGame.quarter, value: apiGame.clock || "" });
    } else {
      stats.push({ label: "In Progress", value: "" });
    }
    if (apiGame.homeScore > 0 || apiGame.awayScore > 0) {
      const leader = apiGame.homeScore > apiGame.awayScore
        ? apiGame.homeTeam.abbreviation
        : apiGame.awayScore > apiGame.homeScore
          ? apiGame.awayTeam.abbreviation
          : "TIE";
      stats.push({ label: "Lead", value: leader });
    }
  } else if (apiGame.status === "final") {
    stats.push({ label: "Final", value: "" });
    const winner = apiGame.homeScore > apiGame.awayScore
      ? apiGame.homeTeam.abbreviation
      : apiGame.awayTeam.abbreviation;
    stats.push({ label: "Winner", value: winner });
  } else {
    if (apiGame.gameDate) {
      const gameTime = new Date(apiGame.gameDate);
      const timeStr = gameTime.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      stats.push({ label: "Tip-off", value: timeStr });
    } else {
      stats.push({ label: "Scheduled", value: "TBD" });
    }
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
    broadcast: apiGame.broadcast,
  };
}

const statusOrder = (g: Game) =>
  g.status === "live" ? 0 : g.status === "scheduled" ? 1 : 2;

/**
 * Server-callable: fetch + transform games for a league. Mirrors the client
 * hook's behavior (NBA pulls WNBA alongside, sorted live → scheduled → final).
 */
export async function getTransformedGames(league: League): Promise<Game[]> {
  try {
    if (league === "nba") {
      const [nba, wnba] = await Promise.all([
        basketballApi.getGames("nba"),
        basketballApi.getGames("wnba"),
      ]);
      const all = [...nba, ...wnba].map((g) => transformGame(g as unknown as ApiGame));
      all.sort((a, b) => statusOrder(a) - statusOrder(b));
      return all;
    }
    const games = await basketballApi.getGames(league);
    return games.map((g) => transformGame(g as unknown as ApiGame));
  } catch (error) {
    console.error(`getTransformedGames(${league}) failed:`, error);
    return [];
  }
}
