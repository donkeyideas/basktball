// Ball Don't Lie API Client
// Free NBA API: https://www.balldontlie.io/
// Rate limit: 60 requests per minute

import { NormalizedGame, NormalizedTeam, NormalizedPlayer, NormalizedPlayerStats } from "./types";

const API_BASE = "https://api.balldontlie.io/v1";

// API Key is optional but recommended for higher rate limits
const API_KEY = process.env.BALLDONTLIE_API_KEY;

interface BdlTeam {
  id: number;
  conference: string;
  division: string;
  city: string;
  name: string;
  full_name: string;
  abbreviation: string;
}

interface BdlPlayer {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
  height: string | null;
  weight: string | null;
  jersey_number: string | null;
  college: string | null;
  country: string | null;
  draft_year: number | null;
  draft_round: number | null;
  draft_number: number | null;
  team: BdlTeam;
}

interface BdlGame {
  id: number;
  date: string;
  season: number;
  status: string;
  period: number;
  time: string;
  postseason: boolean;
  home_team_score: number;
  visitor_team_score: number;
  home_team: BdlTeam;
  visitor_team: BdlTeam;
}

interface BdlStats {
  id: number;
  min: string;
  fgm: number;
  fga: number;
  fg_pct: number;
  fg3m: number;
  fg3a: number;
  fg3_pct: number;
  ftm: number;
  fta: number;
  ft_pct: number;
  oreb: number;
  dreb: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  turnover: number;
  pf: number;
  pts: number;
  player: BdlPlayer;
  team: BdlTeam;
  game: BdlGame;
}

interface BdlPaginatedResponse<T> {
  data: T[];
  meta: {
    total_count: number;
    next_cursor?: number;
    per_page: number;
  };
}

// In-memory cache with TTL
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
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// Rate limiter
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = 60, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async acquire(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter((t) => now - t < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest) + 100;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return this.acquire();
    }

    this.requests.push(now);
  }
}

const rateLimiter = new RateLimiter(60, 60000);

// Fetch helper with rate limiting
async function fetchBdl<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  await rateLimiter.acquire();

  const url = new URL(`${API_BASE}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (API_KEY) {
    headers["Authorization"] = API_KEY;
  }

  const response = await fetch(url.toString(), { headers });

  if (!response.ok) {
    throw new Error(`BallDontLie API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Normalizers
function normalizeTeam(team: BdlTeam): NormalizedTeam {
  return {
    id: team.id.toString(),
    name: team.name,
    abbreviation: team.abbreviation,
    city: team.city,
    logoUrl: `https://cdn.nba.com/logos/nba/${getNbaTeamId(team.abbreviation)}/primary/L/logo.svg`,
    conference: team.conference,
    division: team.division,
  };
}

function normalizePlayer(player: BdlPlayer): NormalizedPlayer {
  return {
    id: player.id.toString(),
    firstName: player.first_name,
    lastName: player.last_name,
    name: `${player.first_name} ${player.last_name}`,
    position: player.position || undefined,
    height: player.height || undefined,
    weight: player.weight ? parseInt(player.weight, 10) : undefined,
    jerseyNumber: player.jersey_number || undefined,
    college: player.college || undefined,
    country: player.country || undefined,
    team: player.team ? normalizeTeam(player.team) : undefined,
  };
}

function normalizeGame(game: BdlGame): NormalizedGame {
  let status: "scheduled" | "live" | "final" = "scheduled";

  if (game.status === "Final") {
    status = "final";
  } else if (game.period > 0 && game.status !== "Final") {
    status = "live";
  }

  return {
    id: game.id.toString(),
    homeTeam: normalizeTeam(game.home_team),
    awayTeam: normalizeTeam(game.visitor_team),
    homeScore: game.home_team_score,
    awayScore: game.visitor_team_score,
    status,
    quarter: game.period > 0 ? `Q${game.period}` : undefined,
    clock: game.time || undefined,
    gameDate: new Date(game.date),
    isPlayoffs: game.postseason,
    season: game.season.toString(),
  };
}

function normalizeStats(stats: BdlStats): NormalizedPlayerStats {
  const minutes = stats.min ? parseInt(stats.min.split(":")[0], 10) : 0;

  return {
    playerId: stats.player.id.toString(),
    gameId: stats.game.id.toString(),
    minutes,
    points: stats.pts,
    rebounds: stats.reb,
    offReb: stats.oreb,
    defReb: stats.dreb,
    assists: stats.ast,
    steals: stats.stl,
    blocks: stats.blk,
    turnovers: stats.turnover,
    fouls: stats.pf,
    fgm: stats.fgm,
    fga: stats.fga,
    fgPct: stats.fg_pct,
    tpm: stats.fg3m,
    tpa: stats.fg3a,
    tpPct: stats.fg3_pct,
    ftm: stats.ftm,
    fta: stats.fta,
    ftPct: stats.ft_pct,
  };
}

// Map team abbreviations to NBA CDN IDs
function getNbaTeamId(abbreviation: string): string {
  const teamIds: Record<string, string> = {
    ATL: "1610612737",
    BOS: "1610612738",
    BKN: "1610612751",
    CHA: "1610612766",
    CHI: "1610612741",
    CLE: "1610612739",
    DAL: "1610612742",
    DEN: "1610612743",
    DET: "1610612765",
    GSW: "1610612744",
    HOU: "1610612745",
    IND: "1610612754",
    LAC: "1610612746",
    LAL: "1610612747",
    MEM: "1610612763",
    MIA: "1610612748",
    MIL: "1610612749",
    MIN: "1610612750",
    NOP: "1610612740",
    NYK: "1610612752",
    OKC: "1610612760",
    ORL: "1610612753",
    PHI: "1610612755",
    PHX: "1610612756",
    POR: "1610612757",
    SAC: "1610612758",
    SAS: "1610612759",
    TOR: "1610612761",
    UTA: "1610612762",
    WAS: "1610612764",
  };
  return teamIds[abbreviation] || "1610612737";
}

// API Client Class
export class BallDontLieClient {
  // Get all NBA teams
  async getTeams(): Promise<NormalizedTeam[]> {
    const cacheKey = "bdl:teams";
    const cached = getFromCache<NormalizedTeam[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetchBdl<BdlPaginatedResponse<BdlTeam>>("/teams");
      const teams = response.data.map(normalizeTeam);
      setCache(cacheKey, teams, 86400000); // 24 hour cache
      return teams;
    } catch (error) {
      console.error("BallDontLie teams fetch error:", error);
      return [];
    }
  }

  // Get players with pagination
  async getPlayers(options?: {
    page?: number;
    perPage?: number;
    search?: string;
    teamIds?: number[];
  }): Promise<{ players: NormalizedPlayer[]; totalCount: number }> {
    const params: Record<string, string> = {};

    if (options?.page) params.cursor = options.page.toString();
    if (options?.perPage) params.per_page = options.perPage.toString();
    if (options?.search) params.search = options.search;
    if (options?.teamIds?.length) {
      options.teamIds.forEach((id) => {
        params[`team_ids[]`] = id.toString();
      });
    }

    try {
      const response = await fetchBdl<BdlPaginatedResponse<BdlPlayer>>("/players", params);
      return {
        players: response.data.map(normalizePlayer),
        totalCount: response.meta.total_count,
      };
    } catch (error) {
      console.error("BallDontLie players fetch error:", error);
      return { players: [], totalCount: 0 };
    }
  }

  // Get single player
  async getPlayer(playerId: string): Promise<NormalizedPlayer | null> {
    const cacheKey = `bdl:player:${playerId}`;
    const cached = getFromCache<NormalizedPlayer>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetchBdl<{ data: BdlPlayer }>(`/players/${playerId}`);
      const player = normalizePlayer(response.data);
      setCache(cacheKey, player, 3600000); // 1 hour cache
      return player;
    } catch (error) {
      console.error("BallDontLie player fetch error:", error);
      return null;
    }
  }

  // Get games for a date range
  async getGames(options?: {
    dates?: string[];
    seasons?: number[];
    teamIds?: number[];
    postseason?: boolean;
    cursor?: number;
    perPage?: number;
  }): Promise<{ games: NormalizedGame[]; nextCursor?: number }> {
    const params: Record<string, string> = {};

    if (options?.dates?.length) {
      options.dates.forEach((date) => {
        params[`dates[]`] = date;
      });
    }
    if (options?.seasons?.length) {
      options.seasons.forEach((season) => {
        params[`seasons[]`] = season.toString();
      });
    }
    if (options?.teamIds?.length) {
      options.teamIds.forEach((id) => {
        params[`team_ids[]`] = id.toString();
      });
    }
    if (options?.postseason !== undefined) {
      params.postseason = options.postseason.toString();
    }
    if (options?.cursor) params.cursor = options.cursor.toString();
    if (options?.perPage) params.per_page = options.perPage.toString();

    try {
      const response = await fetchBdl<BdlPaginatedResponse<BdlGame>>("/games", params);
      return {
        games: response.data.map(normalizeGame),
        nextCursor: response.meta.next_cursor,
      };
    } catch (error) {
      console.error("BallDontLie games fetch error:", error);
      return { games: [] };
    }
  }

  // Get today's games
  async getTodaysGames(): Promise<NormalizedGame[]> {
    const today = new Date().toISOString().split("T")[0];
    const cacheKey = `bdl:games:${today}`;
    const cached = getFromCache<NormalizedGame[]>(cacheKey);
    if (cached) return cached;

    const { games } = await this.getGames({ dates: [today] });
    setCache(cacheKey, games, 60000); // 1 minute cache for live games
    return games;
  }

  // Get player stats for games
  async getStats(options?: {
    playerIds?: number[];
    gameIds?: number[];
    dates?: string[];
    seasons?: number[];
    cursor?: number;
    perPage?: number;
  }): Promise<{ stats: NormalizedPlayerStats[]; nextCursor?: number }> {
    const params: Record<string, string> = {};

    if (options?.playerIds?.length) {
      options.playerIds.forEach((id) => {
        params[`player_ids[]`] = id.toString();
      });
    }
    if (options?.gameIds?.length) {
      options.gameIds.forEach((id) => {
        params[`game_ids[]`] = id.toString();
      });
    }
    if (options?.dates?.length) {
      options.dates.forEach((date) => {
        params[`dates[]`] = date;
      });
    }
    if (options?.seasons?.length) {
      options.seasons.forEach((season) => {
        params[`seasons[]`] = season.toString();
      });
    }
    if (options?.cursor) params.cursor = options.cursor.toString();
    if (options?.perPage) params.per_page = options.perPage.toString();

    try {
      const response = await fetchBdl<BdlPaginatedResponse<BdlStats>>("/stats", params);
      return {
        stats: response.data.map(normalizeStats),
        nextCursor: response.meta.next_cursor,
      };
    } catch (error) {
      console.error("BallDontLie stats fetch error:", error);
      return { stats: [] };
    }
  }

  // Get season averages for players
  async getSeasonAverages(
    season: number,
    playerIds: number[]
  ): Promise<Map<string, NormalizedPlayerStats>> {
    const params: Record<string, string> = {
      season: season.toString(),
    };
    playerIds.forEach((id) => {
      params[`player_ids[]`] = id.toString();
    });

    try {
      const response = await fetchBdl<BdlPaginatedResponse<BdlStats>>("/season_averages", params);
      const averages = new Map<string, NormalizedPlayerStats>();

      response.data.forEach((stat) => {
        averages.set(stat.player.id.toString(), normalizeStats(stat));
      });

      return averages;
    } catch (error) {
      console.error("BallDontLie season averages fetch error:", error);
      return new Map();
    }
  }
}

// Export singleton
export const ballDontLieApi = new BallDontLieClient();
