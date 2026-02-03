// NBA API Client using balldontlie.io
// Free tier: 60 requests/minute
// Docs: https://www.balldontlie.io/

import {
  ApiGame,
  ApiPlayer,
  ApiPlayerStats,
  ApiTeam,
  NormalizedGame,
  NormalizedPlayer,
  NormalizedTeam,
  PaginatedResponse,
} from "./types";

const BASE_URL = "https://api.balldontlie.io/v1";

// NBA team logo URLs (from NBA CDN)
const NBA_TEAM_LOGOS: Record<string, string> = {
  ATL: "https://cdn.nba.com/logos/nba/1610612737/primary/L/logo.svg",
  BOS: "https://cdn.nba.com/logos/nba/1610612738/primary/L/logo.svg",
  BKN: "https://cdn.nba.com/logos/nba/1610612751/primary/L/logo.svg",
  CHA: "https://cdn.nba.com/logos/nba/1610612766/primary/L/logo.svg",
  CHI: "https://cdn.nba.com/logos/nba/1610612741/primary/L/logo.svg",
  CLE: "https://cdn.nba.com/logos/nba/1610612739/primary/L/logo.svg",
  DAL: "https://cdn.nba.com/logos/nba/1610612742/primary/L/logo.svg",
  DEN: "https://cdn.nba.com/logos/nba/1610612743/primary/L/logo.svg",
  DET: "https://cdn.nba.com/logos/nba/1610612765/primary/L/logo.svg",
  GSW: "https://cdn.nba.com/logos/nba/1610612744/primary/L/logo.svg",
  HOU: "https://cdn.nba.com/logos/nba/1610612745/primary/L/logo.svg",
  IND: "https://cdn.nba.com/logos/nba/1610612754/primary/L/logo.svg",
  LAC: "https://cdn.nba.com/logos/nba/1610612746/primary/L/logo.svg",
  LAL: "https://cdn.nba.com/logos/nba/1610612747/primary/L/logo.svg",
  MEM: "https://cdn.nba.com/logos/nba/1610612763/primary/L/logo.svg",
  MIA: "https://cdn.nba.com/logos/nba/1610612748/primary/L/logo.svg",
  MIL: "https://cdn.nba.com/logos/nba/1610612749/primary/L/logo.svg",
  MIN: "https://cdn.nba.com/logos/nba/1610612750/primary/L/logo.svg",
  NOP: "https://cdn.nba.com/logos/nba/1610612740/primary/L/logo.svg",
  NYK: "https://cdn.nba.com/logos/nba/1610612752/primary/L/logo.svg",
  OKC: "https://cdn.nba.com/logos/nba/1610612760/primary/L/logo.svg",
  ORL: "https://cdn.nba.com/logos/nba/1610612753/primary/L/logo.svg",
  PHI: "https://cdn.nba.com/logos/nba/1610612755/primary/L/logo.svg",
  PHX: "https://cdn.nba.com/logos/nba/1610612756/primary/L/logo.svg",
  POR: "https://cdn.nba.com/logos/nba/1610612757/primary/L/logo.svg",
  SAC: "https://cdn.nba.com/logos/nba/1610612758/primary/L/logo.svg",
  SAS: "https://cdn.nba.com/logos/nba/1610612759/primary/L/logo.svg",
  TOR: "https://cdn.nba.com/logos/nba/1610612761/primary/L/logo.svg",
  UTA: "https://cdn.nba.com/logos/nba/1610612762/primary/L/logo.svg",
  WAS: "https://cdn.nba.com/logos/nba/1610612764/primary/L/logo.svg",
};

// Simple in-memory cache
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

// Rate limiter
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 60, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter((t) => now - t < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest) + 100;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return this.waitForSlot();
    }

    this.requests.push(now);
  }
}

const rateLimiter = new RateLimiter(60, 60000);

// API fetch helper
async function fetchApi<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const apiKey = process.env.BALLDONTLIE_API_KEY;

  // If no API key, throw immediately to avoid unnecessary API calls
  if (!apiKey) {
    throw new Error("BALLDONTLIE_API_KEY not configured");
  }

  await rateLimiter.waitForSlot();

  const url = new URL(`${BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "Authorization": apiKey,
  };

  const response = await fetch(url.toString(), { headers });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Normalize API data to our format
function normalizeTeam(team: ApiTeam): NormalizedTeam {
  const abbr = team.abbreviation.toUpperCase();
  return {
    id: String(team.id),
    name: team.name,
    abbreviation: abbr,
    city: team.city || "",
    logoUrl: NBA_TEAM_LOGOS[abbr] || "",
    conference: team.conference,
    division: team.division,
  };
}

function normalizeGame(game: ApiGame): NormalizedGame {
  const statusMap: Record<string, "scheduled" | "live" | "final"> = {
    "Final": "final",
    "In Progress": "live",
    "": "scheduled",
  };

  let status: "scheduled" | "live" | "final" = "scheduled";
  if (game.status === "Final") {
    status = "final";
  } else if (game.home_team_score > 0 || game.visitor_team_score > 0) {
    status = game.period && game.period > 0 ? "live" : "final";
  }

  return {
    id: String(game.id),
    homeTeam: normalizeTeam(game.home_team),
    awayTeam: normalizeTeam(game.visitor_team),
    homeScore: game.home_team_score,
    awayScore: game.visitor_team_score,
    status,
    quarter: game.period ? `Q${game.period}` : undefined,
    clock: game.time || undefined,
    gameDate: new Date(game.date),
    isPlayoffs: game.postseason || false,
  };
}

function normalizePlayer(player: ApiPlayer): NormalizedPlayer {
  const playerId = String(player.id);
  return {
    id: playerId,
    name: `${player.first_name} ${player.last_name}`,
    firstName: player.first_name,
    lastName: player.last_name,
    position: player.position || "N/A",
    jerseyNumber: player.jersey_number,
    team: player.team ? normalizeTeam(player.team) : undefined,
    headshotUrl: `https://cdn.nba.com/headshots/nba/latest/1040x760/${playerId}.png`,
  };
}

// Public API methods
export class NbaApiClient {
  // Get games for a specific date
  async getGamesByDate(date: string): Promise<NormalizedGame[]> {
    const cacheKey = `games:${date}`;
    const cached = getFromCache<NormalizedGame[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetchApi<PaginatedResponse<ApiGame>>("/games", {
        dates: [date].join(","),
      });

      const games = response.data.map(normalizeGame);
      setCache(cacheKey, games, 30000); // Cache for 30 seconds
      return games;
    } catch (error) {
      // Only log if it's not the "API key not configured" error
      if (error instanceof Error && !error.message.includes("not configured")) {
        console.error("Failed to fetch games:", error);
      }
      return [];
    }
  }

  // Get today's games
  async getTodaysGames(): Promise<NormalizedGame[]> {
    const today = new Date().toISOString().split("T")[0];
    return this.getGamesByDate(today);
  }

  // Get all NBA teams
  async getTeams(): Promise<NormalizedTeam[]> {
    const cacheKey = "teams:all";
    const cached = getFromCache<NormalizedTeam[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetchApi<PaginatedResponse<ApiTeam>>("/teams");
      const teams = response.data.map(normalizeTeam);
      setCache(cacheKey, teams, 3600000); // Cache for 1 hour
      return teams;
    } catch (error) {
      console.error("Failed to fetch teams:", error);
      return [];
    }
  }

  // Get a single team
  async getTeam(teamId: string): Promise<NormalizedTeam | null> {
    const cacheKey = `team:${teamId}`;
    const cached = getFromCache<NormalizedTeam>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetchApi<ApiTeam>(`/teams/${teamId}`);
      const team = normalizeTeam(response);
      setCache(cacheKey, team, 3600000); // Cache for 1 hour
      return team;
    } catch (error) {
      console.error("Failed to fetch team:", error);
      return null;
    }
  }

  // Search players by name
  async searchPlayers(query: string, page: number = 1): Promise<NormalizedPlayer[]> {
    const cacheKey = `players:search:${query}:${page}`;
    const cached = getFromCache<NormalizedPlayer[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetchApi<PaginatedResponse<ApiPlayer>>("/players", {
        search: query,
        page: String(page),
        per_page: "25",
      });

      const players = response.data.map(normalizePlayer);
      setCache(cacheKey, players, 900000); // Cache for 15 minutes
      return players;
    } catch (error) {
      console.error("Failed to search players:", error);
      return [];
    }
  }

  // Get a single player
  async getPlayer(playerId: string): Promise<NormalizedPlayer | null> {
    const cacheKey = `player:${playerId}`;
    const cached = getFromCache<NormalizedPlayer>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetchApi<ApiPlayer>(`/players/${playerId}`);
      const player = normalizePlayer(response);
      setCache(cacheKey, player, 900000); // Cache for 15 minutes
      return player;
    } catch (error) {
      console.error("Failed to fetch player:", error);
      return null;
    }
  }

  // Get player stats for a season
  async getPlayerSeasonStats(
    playerId: string,
    season?: number
  ): Promise<ApiPlayerStats[]> {
    const currentSeason = season || new Date().getFullYear();
    const cacheKey = `stats:player:${playerId}:${currentSeason}`;
    const cached = getFromCache<ApiPlayerStats[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetchApi<PaginatedResponse<ApiPlayerStats>>("/stats", {
        player_ids: [playerId].join(","),
        seasons: [String(currentSeason)].join(","),
        per_page: "100",
      });

      setCache(cacheKey, response.data, 900000); // Cache for 15 minutes
      return response.data;
    } catch (error) {
      console.error("Failed to fetch player stats:", error);
      return [];
    }
  }

  // Get box score for a game
  async getGameStats(gameId: string): Promise<ApiPlayerStats[]> {
    const cacheKey = `stats:game:${gameId}`;
    const cached = getFromCache<ApiPlayerStats[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetchApi<PaginatedResponse<ApiPlayerStats>>("/stats", {
        game_ids: [gameId].join(","),
        per_page: "100",
      });

      setCache(cacheKey, response.data, 60000); // Cache for 1 minute
      return response.data;
    } catch (error) {
      console.error("Failed to fetch game stats:", error);
      return [];
    }
  }

  // Get season averages for a player
  async getSeasonAverages(
    playerId: string,
    season?: number
  ): Promise<{
    pts: number;
    reb: number;
    ast: number;
    stl: number;
    blk: number;
    fg_pct: number;
    fg3_pct: number;
    ft_pct: number;
    gamesPlayed: number;
  } | null> {
    const currentSeason = season || new Date().getFullYear();
    const cacheKey = `averages:${playerId}:${currentSeason}`;
    type SeasonAveragesResult = {
      pts: number;
      reb: number;
      ast: number;
      stl: number;
      blk: number;
      fg_pct: number;
      fg3_pct: number;
      ft_pct: number;
      gamesPlayed: number;
    } | null;
    const cached = getFromCache<SeasonAveragesResult>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetchApi<{
        data: Array<{
          pts: number;
          reb: number;
          ast: number;
          stl: number;
          blk: number;
          fg_pct: number;
          fg3_pct: number;
          ft_pct: number;
          games_played: number;
        }>;
      }>("/season_averages", {
        player_ids: [playerId].join(","),
        season: String(currentSeason),
      });

      if (response.data.length === 0) return null;

      const avg = response.data[0];
      const result = {
        pts: avg.pts,
        reb: avg.reb,
        ast: avg.ast,
        stl: avg.stl,
        blk: avg.blk,
        fg_pct: avg.fg_pct,
        fg3_pct: avg.fg3_pct,
        ft_pct: avg.ft_pct,
        gamesPlayed: avg.games_played,
      };

      setCache(cacheKey, result, 900000); // Cache for 15 minutes
      return result;
    } catch (error) {
      console.error("Failed to fetch season averages:", error);
      return null;
    }
  }
}

// Export singleton instance
export const nbaApi = new NbaApiClient();
