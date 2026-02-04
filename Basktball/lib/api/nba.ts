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

  // Get all NBA teams (active only - excludes defunct/historical teams)
  async getTeams(): Promise<NormalizedTeam[]> {
    const cacheKey = "teams:all";
    const cached = getFromCache<NormalizedTeam[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetchApi<PaginatedResponse<ApiTeam>>("/teams");
      // Filter out defunct teams (those without conference/division)
      const activeTeams = response.data.filter(
        (team) => team.conference && team.division
      );
      const teams = activeTeams.map(normalizeTeam);
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
      // BallDontLie API returns { data: team } for single team fetch
      const response = await fetchApi<{ data: ApiTeam }>(`/teams/${teamId}`);
      const team = normalizeTeam(response.data);
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

  // Get team roster (players on a team)
  async getTeamRoster(teamId: string): Promise<NormalizedPlayer[]> {
    const cacheKey = `roster:${teamId}`;
    const cached = getFromCache<NormalizedPlayer[]>(cacheKey);
    if (cached) return cached;

    try {
      // BallDontLie API: get all players, filter by team
      // Note: This fetches active players - may need pagination for full roster
      const response = await fetchApi<PaginatedResponse<ApiPlayer>>("/players", {
        team_ids: teamId,
        per_page: "100",
      });

      const players = response.data.map(normalizePlayer);
      setCache(cacheKey, players, 900000); // Cache for 15 minutes
      return players;
    } catch (error) {
      console.error("Failed to fetch team roster:", error);
      return [];
    }
  }

  // Get team's recent games
  async getTeamGames(
    teamId: string,
    options?: { season?: number; perPage?: number }
  ): Promise<NormalizedGame[]> {
    const season = options?.season || new Date().getFullYear();
    const perPage = options?.perPage || 20;
    const cacheKey = `team:games:${teamId}:${season}:${perPage}`;
    const cached = getFromCache<NormalizedGame[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetchApi<PaginatedResponse<ApiGame>>("/games", {
        team_ids: teamId,
        seasons: String(season),
        per_page: String(perPage),
      });

      const games = response.data.map(normalizeGame);
      // Sort by date descending (most recent first)
      games.sort((a, b) => b.gameDate.getTime() - a.gameDate.getTime());
      setCache(cacheKey, games, 300000); // Cache for 5 minutes
      return games;
    } catch (error) {
      console.error("Failed to fetch team games:", error);
      return [];
    }
  }

  // Get all active players (for database sync)
  async getAllPlayers(options?: { cursor?: number; perPage?: number }): Promise<{
    players: NormalizedPlayer[];
    nextCursor: number | null;
  }> {
    const perPage = options?.perPage || 100;
    const cursor = options?.cursor || 0;

    try {
      const response = await fetchApi<PaginatedResponse<ApiPlayer>>("/players", {
        cursor: String(cursor),
        per_page: String(perPage),
      });

      const players = response.data.map(normalizePlayer);
      const nextCursor = response.meta?.next_cursor || null;

      return { players, nextCursor };
    } catch (error) {
      console.error("Failed to fetch all players:", error);
      return { players: [], nextCursor: null };
    }
  }

  // Get team stats (aggregated from recent games)
  async getTeamStats(teamId: string, season?: number): Promise<{
    wins: number;
    losses: number;
    winPct: number;
    ppg: number;
    oppPpg: number;
    recentGames: Array<{ opponent: string; result: string; score: string }>;
  } | null> {
    const currentSeason = season || new Date().getFullYear();
    const cacheKey = `team:stats:${teamId}:${currentSeason}`;
    const cached = getFromCache<{
      wins: number;
      losses: number;
      winPct: number;
      ppg: number;
      oppPpg: number;
      recentGames: Array<{ opponent: string; result: string; score: string }>;
    }>(cacheKey);
    if (cached) return cached;

    try {
      // Get team's games for this season
      const response = await fetchApi<PaginatedResponse<ApiGame>>("/games", {
        team_ids: teamId,
        seasons: String(currentSeason),
        per_page: "100",
      });

      const games = response.data.filter(
        (g) => g.status === "Final" && (g.home_team_score > 0 || g.visitor_team_score > 0)
      );

      if (games.length === 0) {
        return null;
      }

      let wins = 0;
      let losses = 0;
      let totalPoints = 0;
      let totalOppPoints = 0;

      const recentGames: Array<{ opponent: string; result: string; score: string }> = [];

      for (const game of games) {
        const isHome = String(game.home_team.id) === teamId;
        const teamScore = isHome ? game.home_team_score : game.visitor_team_score;
        const oppScore = isHome ? game.visitor_team_score : game.home_team_score;
        const opponent = isHome ? game.visitor_team : game.home_team;

        totalPoints += teamScore;
        totalOppPoints += oppScore;

        if (teamScore > oppScore) {
          wins++;
          if (recentGames.length < 5) {
            recentGames.push({
              opponent: opponent.abbreviation,
              result: "W",
              score: `${teamScore}-${oppScore}`,
            });
          }
        } else {
          losses++;
          if (recentGames.length < 5) {
            recentGames.push({
              opponent: opponent.abbreviation,
              result: "L",
              score: `${teamScore}-${oppScore}`,
            });
          }
        }
      }

      const totalGames = wins + losses;
      const result = {
        wins,
        losses,
        winPct: totalGames > 0 ? Math.round((wins / totalGames) * 1000) / 10 : 0,
        ppg: totalGames > 0 ? Math.round((totalPoints / totalGames) * 10) / 10 : 0,
        oppPpg: totalGames > 0 ? Math.round((totalOppPoints / totalGames) * 10) / 10 : 0,
        recentGames,
      };

      setCache(cacheKey, result, 900000); // Cache for 15 minutes
      return result;
    } catch (error) {
      console.error("Failed to fetch team stats:", error);
      return null;
    }
  }
}

// Export singleton instance
export const nbaApi = new NbaApiClient();
