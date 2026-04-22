// ESPN API Client (Fallback/Alternative Source)
// ESPN has public endpoints for scores and basic data

import { NormalizedGame, NormalizedTeam } from "./types";
import { trackApiCall, ApiProvider } from "./tracker";

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball";

interface EspnTeam {
  id: string;
  name: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  logo?: string;
  logos?: Array<{ href: string; width?: number; height?: number }>;
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

interface EspnBroadcast {
  market: string;
  names: string[];
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
    broadcasts?: EspnBroadcast[];
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
  const startTime = Date.now();
  try {
    const response = await fetch(`${ESPN_BASE}${endpoint}`, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      trackApiCall({
        provider: ApiProvider.ESPN,
        endpoint,
        statusCode: response.status,
        responseTime: Date.now() - startTime,
        error: `HTTP ${response.status}`,
      });
      throw new Error(`ESPN API Error: ${response.status}`);
    }

    const data = await response.json();
    trackApiCall({
      provider: ApiProvider.ESPN,
      endpoint,
      statusCode: 200,
      responseTime: Date.now() - startTime,
    });
    return data;
  } catch (error) {
    if (!(error instanceof Error && error.message.startsWith("ESPN API Error:"))) {
      trackApiCall({
        provider: ApiProvider.ESPN,
        endpoint,
        statusCode: 0,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    throw error;
  }
}

// Normalize ESPN data
function normalizeEspnTeam(team: EspnTeam): NormalizedTeam {
  // ESPN returns logos in array for teams endpoint, single logo for scoreboard
  const logoUrl = team.logos?.[0]?.href || team.logo || "";

  // ESPN fields: displayName="Arizona State Sun Devils", name="Sun Devils", shortDisplayName="Arizona St"
  // Extract city by removing the mascot name from the full displayName
  const city = team.displayName.replace(` ${team.name}`, "").trim();

  return {
    id: team.id,
    name: team.name,
    abbreviation: team.abbreviation,
    city,
    logoUrl,
  };
}

function normalizeEspnGame(event: EspnEvent, league?: "nba" | "wnba" | "ncaam" | "ncaaw"): NormalizedGame | null {
  const competition = event.competitions[0];
  if (!competition) return null;

  const homeComp = competition.competitors.find((c) => c.homeAway === "home");
  const awayComp = competition.competitors.find((c) => c.homeAway === "away");

  if (!homeComp || !awayComp) return null;

  const status = competition.status;
  const homeScore = parseInt(homeComp.score || "0", 10);
  const awayScore = parseInt(awayComp.score || "0", 10);
  const period = status.period || 0;

  let gameStatus: "scheduled" | "live" | "final" = "scheduled";

  if (status.type.state === "post" || status.type.completed) {
    gameStatus = "final";
  } else if (status.type.state === "in") {
    // Only mark as live if the game has ACTUAL scores
    // ESPN sets state="in" and period=1 before games start, so we need actual scores
    // OR a running clock (displayClock that's not "0:00" or empty)
    const hasScores = homeScore > 0 || awayScore > 0;
    const hasRunningClock = status.displayClock && status.displayClock !== "0:00" && period > 0;

    if (hasScores || hasRunningClock) {
      gameStatus = "live";
    } else {
      // ESPN says "in" but no scores and no clock running - game hasn't actually started
      gameStatus = "scheduled";
    }
  } else if (status.type.state === "pre") {
    gameStatus = "scheduled";
  }

  // Extract broadcast network names
  const broadcasts = competition.broadcasts || [];
  const broadcastNames = broadcasts
    .flatMap(b => b.names || [])
    .filter(Boolean);
  const broadcast = broadcastNames.length > 0 ? broadcastNames.join(", ") : undefined;

  // Detect playoffs from event name or status description
  const eventName = (event.name || "").toLowerCase();
  const statusDesc = (status.type?.description || "").toLowerCase();
  const shortDetail = (status.type?.shortDetail || "").toLowerCase();
  const isPlayoffs =
    eventName.includes("playoff") ||
    eventName.includes("postseason") ||
    statusDesc.includes("playoff") ||
    shortDetail.includes("playoff") ||
    // NBA-specific: series game indicators
    / - game \d/i.test(event.name || "") ||
    /gm \d/i.test(status.type?.shortDetail || "");

  return {
    id: event.id,
    homeTeam: normalizeEspnTeam(homeComp.team),
    awayTeam: normalizeEspnTeam(awayComp.team),
    homeScore,
    awayScore,
    status: gameStatus,
    quarter: period > 0 ? `Q${period}` : undefined,
    clock: status.displayClock || undefined,
    gameDate: new Date(event.date),
    isPlayoffs,
    broadcast,
    league,
  };
}

export class EspnApiClient {
  // Get NBA games for today (or specific date)
  async getNbaGames(date?: string): Promise<NormalizedGame[]> {
    const dateParam = date ? `?dates=${date.replace(/-/g, "")}` : "";
    const cacheKey = `espn:nba:games:${date || "today"}`;
    const cached = getFromCache<NormalizedGame[]>(cacheKey);
    if (cached) {
      trackApiCall({ provider: ApiProvider.ESPN, endpoint: `/nba/scoreboard${dateParam}`, responseTime: 0, cached: true });
      return cached;
    }

    try {
      const data = await fetchEspn<EspnScoreboard>(`/nba/scoreboard${dateParam}`);
      const games = data.events
        .map((e) => normalizeEspnGame(e, "nba"))
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
    if (cached) {
      trackApiCall({ provider: ApiProvider.ESPN, endpoint: `/wnba/scoreboard${dateParam}`, responseTime: 0, cached: true });
      return cached;
    }

    try {
      const data = await fetchEspn<EspnScoreboard>(`/wnba/scoreboard${dateParam}`);
      const games = data.events
        .map((e) => normalizeEspnGame(e, "wnba"))
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
    if (cached) {
      trackApiCall({ provider: ApiProvider.ESPN, endpoint: `/mens-college-basketball/scoreboard${dateParam}`, responseTime: 0, cached: true });
      return cached;
    }

    try {
      const data = await fetchEspn<EspnScoreboard>(
        `/mens-college-basketball/scoreboard${dateParam}`
      );
      const games = data.events
        .map((e) => normalizeEspnGame(e, "ncaam"))
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
    if (cached) {
      trackApiCall({ provider: ApiProvider.ESPN, endpoint: `/womens-college-basketball/scoreboard${dateParam}`, responseTime: 0, cached: true });
      return cached;
    }

    try {
      const data = await fetchEspn<EspnScoreboard>(
        `/womens-college-basketball/scoreboard${dateParam}`
      );
      const games = data.events
        .map((e) => normalizeEspnGame(e, "ncaaw"))
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

  // Get NBA teams (fallback when BDL API is unavailable)
  async getNbaTeams(): Promise<NormalizedTeam[]> {
    const cacheKey = "espn:nba:teams";
    const cached = getFromCache<NormalizedTeam[]>(cacheKey);
    if (cached) {
      trackApiCall({ provider: ApiProvider.ESPN, endpoint: "/nba/teams", responseTime: 0, cached: true });
      return cached;
    }

    try {
      const data = await fetchEspn<{ sports: Array<{ leagues: Array<{ teams: Array<{ team: EspnTeam }> }> }> }>(
        "/nba/teams"
      );
      const teams = data.sports?.[0]?.leagues?.[0]?.teams?.map((t) => {
        const team = normalizeEspnTeam(t.team);
        return { ...team, league: "nba" as const };
      }) || [];

      setCache(cacheKey, teams, 3600000); // 1 hour cache
      return teams;
    } catch (error) {
      console.error("ESPN NBA teams fetch error:", error);
      return [];
    }
  }

  // Get WNBA teams
  async getWnbaTeams(): Promise<NormalizedTeam[]> {
    const cacheKey = "espn:wnba:teams";
    const cached = getFromCache<NormalizedTeam[]>(cacheKey);
    if (cached) {
      trackApiCall({ provider: ApiProvider.ESPN, endpoint: "/wnba/teams", responseTime: 0, cached: true });
      return cached;
    }

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
    if (cached) {
      trackApiCall({ provider: ApiProvider.ESPN, endpoint: "/mens-college-basketball/teams", responseTime: 0, cached: true });
      return cached;
    }

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
    if (cached) {
      trackApiCall({ provider: ApiProvider.ESPN, endpoint: "/womens-college-basketball/teams", responseTime: 0, cached: true });
      return cached;
    }

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

  // Get NBA standings (conference rankings, records, playoff status)
  async getNbaStandings(): Promise<{
    eastern: Array<{ team: string; abbreviation: string; wins: number; losses: number; seed: number; clincher: string }>;
    western: Array<{ team: string; abbreviation: string; wins: number; losses: number; seed: number; clincher: string }>;
  }> {
    const cacheKey = "espn:nba:standings";
    const cached = getFromCache<{
      eastern: Array<{ team: string; abbreviation: string; wins: number; losses: number; seed: number; clincher: string }>;
      western: Array<{ team: string; abbreviation: string; wins: number; losses: number; seed: number; clincher: string }>;
    }>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        "https://site.api.espn.com/apis/v2/sports/basketball/nba/standings",
        { headers: { Accept: "application/json" } }
      );
      if (!response.ok) throw new Error(`ESPN standings: ${response.status}`);
      const data = await response.json();

      const result: {
        eastern: Array<{ team: string; abbreviation: string; wins: number; losses: number; seed: number; clincher: string }>;
        western: Array<{ team: string; abbreviation: string; wins: number; losses: number; seed: number; clincher: string }>;
      } = { eastern: [], western: [] };

      // data.children contains conference groups
      for (const conference of data.children || []) {
        const confName = (conference.name || "").toLowerCase();
        const isEast = confName.includes("east");
        const entries = conference.standings?.entries || [];

        for (const entry of entries) {
          const team = entry.team;
          const stats = entry.stats || [];

          const getStat = (name: string) => {
            const s = stats.find((st: { name: string }) => st.name === name);
            return s?.value ?? s?.displayValue ?? "";
          };

          const parsed = {
            team: `${team?.location || ""} ${team?.name || ""}`.trim(),
            abbreviation: team?.abbreviation || "",
            wins: parseInt(String(getStat("wins"))) || 0,
            losses: parseInt(String(getStat("losses"))) || 0,
            seed: parseInt(String(getStat("playoffSeed"))) || 0,
            clincher: String(getStat("clincher") || ""),
          };

          if (isEast) {
            result.eastern.push(parsed);
          } else {
            result.western.push(parsed);
          }
        }
      }

      // Sort by seed
      result.eastern.sort((a, b) => a.seed - b.seed);
      result.western.sort((a, b) => a.seed - b.seed);

      setCache(cacheKey, result, 1800000); // 30 min cache
      return result;
    } catch (error) {
      console.error("ESPN standings fetch error:", error);
      return { eastern: [], western: [] };
    }
  }
}

// Export singleton
export const espnApi = new EspnApiClient();
