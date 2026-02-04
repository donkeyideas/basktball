// ESPN API Client (Fallback/Alternative Source)
// ESPN has public endpoints for scores and basic data

import { NormalizedGame, NormalizedTeam } from "./types";

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball";

interface EspnTeam {
  id: string;
  name: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  logo?: string;
  color?: string;
  alternateColor?: string;
}

interface EspnCompetitor {
  id: string;
  homeAway: "home" | "away";
  score?: string;
  team: EspnTeam;
  winner?: boolean;
}

interface EspnStatus {
  clock?: number;
  displayClock?: string;
  period?: number;
  type: {
    id: string;
    name: string;
    state: "pre" | "in" | "post";
    completed: boolean;
    description: string;
    shortDetail: string;
  };
}

interface EspnEvent {
  id: string;
  uid: string;
  date: string;
  name: string;
  shortName: string;
  competitions: Array<{
    id: string;
    date: string;
    competitors: EspnCompetitor[];
    status: EspnStatus;
    venue?: {
      fullName: string;
      address?: {
        city: string;
        state: string;
      };
    };
  }>;
}

interface EspnScoreboard {
  events: EspnEvent[];
  leagues: Array<{
    id: string;
    name: string;
    abbreviation: string;
  }>;
}

// In-memory cache
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache<T>(key: string, data: T, ttlMs: number): void {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

// Helper to fetch from ESPN
async function fetchEspn<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${ESPN_BASE}${endpoint}`, {
    headers: {
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`ESPN API Error: ${response.status}`);
  }

  return response.json();
}

// Normalize ESPN data
function normalizeEspnTeam(team: EspnTeam): NormalizedTeam {
  return {
    id: team.id,
    name: team.shortDisplayName || team.name,
    abbreviation: team.abbreviation,
    city: team.displayName.replace(` ${team.name}`, ""),
    logoUrl: team.logo || "",
  };
}

function normalizeEspnGame(event: EspnEvent): NormalizedGame | null {
  const competition = event.competitions[0];
  if (!competition) return null;

  const homeComp = competition.competitors.find((c) => c.homeAway === "home");
  const awayComp = competition.competitors.find((c) => c.homeAway === "away");

  if (!homeComp || !awayComp) return null;

  const status = competition.status;
  let gameStatus: "scheduled" | "live" | "final" = "scheduled";

  if (status.type.state === "post" || status.type.completed) {
    gameStatus = "final";
  } else if (status.type.state === "in") {
    gameStatus = "live";
  }

  return {
    id: event.id,
    homeTeam: normalizeEspnTeam(homeComp.team),
    awayTeam: normalizeEspnTeam(awayComp.team),
    homeScore: parseInt(homeComp.score || "0", 10),
    awayScore: parseInt(awayComp.score || "0", 10),
    status: gameStatus,
    quarter: status.period ? `Q${status.period}` : undefined,
    clock: status.displayClock || undefined,
    gameDate: new Date(event.date),
    isPlayoffs: false,
  };
}

export class EspnApiClient {
  // Get NBA games for today (or specific date)
  async getNbaGames(date?: string): Promise<NormalizedGame[]> {
    const dateParam = date ? `?dates=${date.replace(/-/g, "")}` : "";
    const cacheKey = `espn:nba:games:${date || "today"}`;
    const cached = getFromCache<NormalizedGame[]>(cacheKey);
    if (cached) return cached;

    try {
      const data = await fetchEspn<EspnScoreboard>(`/nba/scoreboard${dateParam}`);
      const games = data.events
        .map(normalizeEspnGame)
        .filter((g): g is NormalizedGame => g !== null);

      setCache(cacheKey, games, 30000); // 30 second cache
      return games;
    } catch (error) {
      console.error("ESPN NBA fetch error:", error);
      return [];
    }
  }

  // Get WNBA games
  async getWnbaGames(date?: string): Promise<NormalizedGame[]> {
    const dateParam = date ? `?dates=${date.replace(/-/g, "")}` : "";
    const cacheKey = `espn:wnba:games:${date || "today"}`;
    const cached = getFromCache<NormalizedGame[]>(cacheKey);
    if (cached) return cached;

    try {
      const data = await fetchEspn<EspnScoreboard>(`/wnba/scoreboard${dateParam}`);
      const games = data.events
        .map(normalizeEspnGame)
        .filter((g): g is NormalizedGame => g !== null);

      setCache(cacheKey, games, 30000);
      return games;
    } catch (error) {
      console.error("ESPN WNBA fetch error:", error);
      return [];
    }
  }

  // Get NCAA Men's Basketball games
  async getNcaaMGames(date?: string): Promise<NormalizedGame[]> {
    const dateParam = date ? `?dates=${date.replace(/-/g, "")}` : "";
    const cacheKey = `espn:ncaam:games:${date || "today"}`;
    const cached = getFromCache<NormalizedGame[]>(cacheKey);
    if (cached) return cached;

    try {
      const data = await fetchEspn<EspnScoreboard>(
        `/mens-college-basketball/scoreboard${dateParam}`
      );
      const games = data.events
        .map(normalizeEspnGame)
        .filter((g): g is NormalizedGame => g !== null);

      setCache(cacheKey, games, 30000);
      return games;
    } catch (error) {
      console.error("ESPN NCAAM fetch error:", error);
      return [];
    }
  }

  // Get NCAA Women's Basketball games
  async getNcaaWGames(date?: string): Promise<NormalizedGame[]> {
    const dateParam = date ? `?dates=${date.replace(/-/g, "")}` : "";
    const cacheKey = `espn:ncaaw:games:${date || "today"}`;
    const cached = getFromCache<NormalizedGame[]>(cacheKey);
    if (cached) return cached;

    try {
      const data = await fetchEspn<EspnScoreboard>(
        `/womens-college-basketball/scoreboard${dateParam}`
      );
      const games = data.events
        .map(normalizeEspnGame)
        .filter((g): g is NormalizedGame => g !== null);

      setCache(cacheKey, games, 30000);
      return games;
    } catch (error) {
      console.error("ESPN NCAAW fetch error:", error);
      return [];
    }
  }

  // Get games by league
  async getGamesByLeague(
    league: "nba" | "wnba" | "ncaam" | "ncaaw",
    date?: string
  ): Promise<NormalizedGame[]> {
    switch (league) {
      case "nba":
        return this.getNbaGames(date);
      case "wnba":
        return this.getWnbaGames(date);
      case "ncaam":
        return this.getNcaaMGames(date);
      case "ncaaw":
        return this.getNcaaWGames(date);
      default:
        return [];
    }
  }

  // Get WNBA teams
  async getWnbaTeams(): Promise<NormalizedTeam[]> {
    const cacheKey = "espn:wnba:teams";
    const cached = getFromCache<NormalizedTeam[]>(cacheKey);
    if (cached) return cached;

    try {
      const data = await fetchEspn<{ sports: Array<{ leagues: Array<{ teams: Array<{ team: EspnTeam }> }> }> }>(
        "/wnba/teams"
      );
      const teams = data.sports?.[0]?.leagues?.[0]?.teams?.map((t) => ({
        ...normalizeEspnTeam(t.team),
        league: "wnba" as const,
      })) || [];

      setCache(cacheKey, teams, 3600000); // 1 hour cache
      return teams;
    } catch (error) {
      console.error("ESPN WNBA teams fetch error:", error);
      return [];
    }
  }

  // Get NCAA Men's Basketball teams (top 25 / ranked)
  async getNcaaMTeams(): Promise<NormalizedTeam[]> {
    const cacheKey = "espn:ncaam:teams";
    const cached = getFromCache<NormalizedTeam[]>(cacheKey);
    if (cached) return cached;

    try {
      const data = await fetchEspn<{ sports: Array<{ leagues: Array<{ teams: Array<{ team: EspnTeam }> }> }> }>(
        "/mens-college-basketball/teams?limit=100"
      );
      const teams = data.sports?.[0]?.leagues?.[0]?.teams?.map((t) => ({
        ...normalizeEspnTeam(t.team),
        league: "ncaam" as const,
      })) || [];

      setCache(cacheKey, teams, 3600000); // 1 hour cache
      return teams;
    } catch (error) {
      console.error("ESPN NCAAM teams fetch error:", error);
      return [];
    }
  }

  // Get NCAA Women's Basketball teams
  async getNcaaWTeams(): Promise<NormalizedTeam[]> {
    const cacheKey = "espn:ncaaw:teams";
    const cached = getFromCache<NormalizedTeam[]>(cacheKey);
    if (cached) return cached;

    try {
      const data = await fetchEspn<{ sports: Array<{ leagues: Array<{ teams: Array<{ team: EspnTeam }> }> }> }>(
        "/womens-college-basketball/teams?limit=100"
      );
      const teams = data.sports?.[0]?.leagues?.[0]?.teams?.map((t) => ({
        ...normalizeEspnTeam(t.team),
        league: "ncaaw" as const,
      })) || [];

      setCache(cacheKey, teams, 3600000); // 1 hour cache
      return teams;
    } catch (error) {
      console.error("ESPN NCAAW teams fetch error:", error);
      return [];
    }
  }

  // Get teams by league
  async getTeamsByLeague(
    league: "wnba" | "ncaam" | "ncaaw"
  ): Promise<NormalizedTeam[]> {
    switch (league) {
      case "wnba":
        return this.getWnbaTeams();
      case "ncaam":
        return this.getNcaaMTeams();
      case "ncaaw":
        return this.getNcaaWTeams();
      default:
        return [];
    }
  }
}

// Export singleton
export const espnApi = new EspnApiClient();
