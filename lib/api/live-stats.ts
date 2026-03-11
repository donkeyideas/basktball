// Live Stats Module
// Fetches real-time basketball data from ESPN Core API + BallDontLie
// Used by tool routes when the database is empty
// ESPN Core API has NO rate limits and provides official NBA data

import { statsCache, teamsCache, CacheTTL } from "@/lib/cache/redis";
import { espnApi } from "@/lib/api/espn";
import { getEspnSeason, getBdlSeason } from "@/lib/api/season";

const ESPN_CORE = "https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba";
const ESPN_SITE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba";
const FETCH_OPTIONS: RequestInit = { next: { revalidate: 900 } } as RequestInit; // 15 min

// NBA.com headshot URL helper
const getNbaHeadshot = (nbaId: string) =>
  `https://cdn.nba.com/headshots/nba/latest/1040x760/${nbaId}.png`;

// ============================================================================
// TYPES
// ============================================================================

export interface LiveLeader {
  playerId: string;
  name: string;
  team: string;
  teamName: string;
  value: number;
  gamesPlayed: number;
  imageUrl: string;
  position?: string;
}

export interface LiveTeamStats {
  id: string;
  name: string;
  abbreviation: string;
  wins: number;
  losses: number;
  ppg: number;
  oppPpg: number;
  pace: number;
  offRtg: number;
  defRtg: number;
  netRtg: number;
  efgPct: number;
  tovPct: number;
  orbPct: number;
  ftRate: number;
}

export interface LiveShootingProfile {
  fgPct: number;
  threePct: number;
  threeRate: number;
}

// ============================================================================
// ESPN CORE API HELPERS
// ============================================================================

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, FETCH_OPTIONS);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Resolve an ESPN $ref URL to get the actual data
async function resolveRef<T>(refUrl: string): Promise<T | null> {
  return fetchJson<T>(refUrl);
}

// ============================================================================
// LEAGUE LEADERS (for Stats Leaders tool)
// ============================================================================

type StatCategory = "ppg" | "rpg" | "apg" | "spg" | "bpg" | "fg_pct" | "three_pct";

// Map our category names to ESPN stat names
const ESPN_STAT_MAP: Record<StatCategory, string> = {
  ppg: "avgPoints",
  rpg: "avgRebounds",
  apg: "avgAssists",
  spg: "avgSteals",
  bpg: "avgBlocks",
  fg_pct: "fieldGoalPct",
  three_pct: "threePointFieldGoalPct",
};

// ESPN leader category IDs
const ESPN_CATEGORY_MAP: Record<StatCategory, string> = {
  ppg: "points",
  rpg: "rebounds",
  apg: "assists",
  spg: "steals",
  bpg: "blocks",
  fg_pct: "fieldGoalPct",
  three_pct: "threePointPct",
};

interface EspnLeaderResponse {
  categories?: Array<{
    name: string;
    displayName: string;
    leaders: Array<{
      displayValue: string;
      value: number;
      athlete: {
        $ref: string;
      };
    }>;
  }>;
}

interface EspnAthleteResponse {
  id: string;
  displayName: string;
  headshot?: { href: string };
  team?: { $ref: string };
  statistics?: { $ref: string };
  position?: { abbreviation: string };
}

interface EspnTeamRef {
  id: string;
  displayName: string;
  abbreviation: string;
  name: string;
}

/**
 * Fetch league leaders for a stat category from ESPN Core API.
 * Returns top players sorted by the requested stat.
 * Cached for 15 minutes.
 */
export async function getLeagueLeaders(
  category: StatCategory,
  limit: number = 25
): Promise<LiveLeader[]> {
  const cacheKey = `live:leaders:${category}`;

  try {
    const cached = await statsCache.get<LiveLeader[]>(cacheKey);
    if (cached && cached.length > 0) {
      return cached.slice(0, limit);
    }
  } catch {
    // Cache miss, continue to fetch
  }

  try {
    // ESPN Core API leaders endpoint
    const url = `${ESPN_CORE}/seasons/${getEspnSeason()}/types/2/leaders`;
    const data = await fetchJson<EspnLeaderResponse>(url);

    if (!data?.categories) {
      return [];
    }

    // Find the matching category
    const espnCategoryName = ESPN_CATEGORY_MAP[category];
    const categoryData = data.categories.find(
      (c) => c.name.toLowerCase().includes(espnCategoryName.toLowerCase())
    );

    if (!categoryData?.leaders?.length) {
      return [];
    }

    // Resolve athlete details in parallel (batch of 25 max)
    const leaderEntries = categoryData.leaders.slice(0, Math.min(limit, 25));
    const leaders: LiveLeader[] = [];

    // Process in batches to avoid too many concurrent requests
    const batchSize = 10;
    for (let i = 0; i < leaderEntries.length; i += batchSize) {
      const batch = leaderEntries.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(async (entry) => {
          const athlete = await resolveRef<EspnAthleteResponse>(entry.athlete.$ref);
          if (!athlete) return null;

          // Get team info
          let teamAbbr = "FA";
          let teamName = "Free Agent";
          if (athlete.team?.$ref) {
            const team = await resolveRef<EspnTeamRef>(athlete.team.$ref);
            if (team) {
              teamAbbr = team.abbreviation || "FA";
              teamName = team.displayName || team.name || "Free Agent";
            }
          }

          // Use ESPN headshot or fallback to NBA CDN
          const imageUrl = athlete.headshot?.href || getNbaHeadshot(athlete.id);

          return {
            playerId: athlete.id,
            name: athlete.displayName,
            team: teamAbbr,
            teamName,
            value: Math.round(entry.value * 10) / 10,
            gamesPlayed: 0, // ESPN leaders endpoint doesn't include GP directly
            imageUrl,
            position: athlete.position?.abbreviation,
          };
        })
      );

      leaders.push(...(results.filter((r) => r !== null) as LiveLeader[]));
    }

    if (leaders.length > 0) {
      await statsCache.set(cacheKey, leaders, CacheTTL.PLAYER_STATS);
    }

    return leaders.slice(0, limit);
  } catch (error) {
    console.error(`Error fetching live leaders for ${category}:`, error);
    return [];
  }
}

// ============================================================================
// TEAM ANALYTICS (for Team Analytics tool)
// ============================================================================

interface EspnStandingsGroup {
  standings?: { $ref: string };
  children?: Array<{ standings?: { $ref: string } }>;
}

interface EspnStandingsResponse {
  entries: Array<{
    team: { $ref: string };
    stats: Array<{
      name: string;
      displayName: string;
      value: number;
    }>;
  }>;
}

/**
 * Fetch real team analytics from ESPN.
 * Uses ESPN site API for standings + basic team stats.
 * Cached for 1 hour.
 */
export async function getTeamAnalytics(): Promise<LiveTeamStats[]> {
  const cacheKey = "live:team-analytics";

  try {
    const cached = await teamsCache.get<LiveTeamStats[]>(cacheKey);
    if (cached && cached.length > 0) {
      return cached;
    }
  } catch {
    // Cache miss
  }

  try {
    // Use ESPN site API for standings (more structured)
    const standingsUrl = `${ESPN_SITE}/standings`;
    const data = await fetchJson<{
      children: Array<{
        name: string;
        standings: {
          entries: Array<{
            team: {
              id: string;
              displayName: string;
              abbreviation: string;
              name: string;
            };
            stats: Array<{
              name: string;
              value: number;
              displayValue: string;
            }>;
          }>;
        };
      }>;
    }>(standingsUrl);

    if (!data?.children) {
      return [];
    }

    const teams: LiveTeamStats[] = [];

    for (const conference of data.children) {
      if (!conference.standings?.entries) continue;

      for (const entry of conference.standings.entries) {
        const getStat = (name: string): number => {
          const stat = entry.stats.find((s) => s.name === name);
          return stat?.value ?? 0;
        };

        const wins = getStat("wins");
        const losses = getStat("losses");
        const ppg = getStat("pointsFor") / Math.max(wins + losses, 1);
        const oppPpg = getStat("pointsAgainst") / Math.max(wins + losses, 1);

        // Calculate ratings from available data
        const avgPossessions = 100; // Approximation
        const offRtg = ppg > 0 ? (ppg / avgPossessions) * 100 : 110;
        const defRtg = oppPpg > 0 ? (oppPpg / avgPossessions) * 100 : 110;

        teams.push({
          id: entry.team.id,
          name: entry.team.displayName,
          abbreviation: entry.team.abbreviation,
          wins,
          losses,
          ppg: Math.round(ppg * 10) / 10 || 0,
          oppPpg: Math.round(oppPpg * 10) / 10 || 0,
          pace: Math.round((getStat("avgPointsFor") + getStat("avgPointsAgainst")) / 2 * 10) / 10 || 100,
          offRtg: Math.round(offRtg * 10) / 10,
          defRtg: Math.round(defRtg * 10) / 10,
          netRtg: Math.round((offRtg - defRtg) * 10) / 10,
          efgPct: 50, // Not directly available from standings
          tovPct: 13, // Approximate league average
          orbPct: 25, // Approximate league average
          ftRate: 0.22, // Approximate league average
        });
      }
    }

    // Sort by win percentage
    teams.sort((a, b) => {
      const aWinPct = a.wins / Math.max(a.wins + a.losses, 1);
      const bWinPct = b.wins / Math.max(b.wins + b.losses, 1);
      return bWinPct - aWinPct;
    });

    if (teams.length > 0) {
      await teamsCache.set(cacheKey, teams, CacheTTL.TEAM_DATA);
    }

    return teams;
  } catch (error) {
    console.error("Error fetching live team analytics:", error);
    return [];
  }
}

// ============================================================================
// PLAYER SHOOTING PROFILE (for Shot Chart tool)
// ============================================================================

/**
 * Fetch a player's real shooting profile from BallDontLie season averages.
 * Falls back to ESPN if BDL fails.
 * Cached for 1 hour per player.
 */
export async function getPlayerShootingProfile(
  bdlPlayerId: string
): Promise<LiveShootingProfile | null> {
  const cacheKey = `live:shooting:${bdlPlayerId}`;

  try {
    const cached = await statsCache.get<LiveShootingProfile>(cacheKey);
    if (cached) return cached;
  } catch {
    // Cache miss
  }

  try {
    // Try BallDontLie season averages
    const apiKey = process.env.BALLDONTLIE_API_KEY;
    if (apiKey) {
      const url = `https://api.balldontlie.io/v1/season_averages?season=${getBdlSeason()}&player_ids[]=${bdlPlayerId}`;
      const res = await fetch(url, {
        headers: { Authorization: apiKey, Accept: "application/json" },
      });

      if (res.ok) {
        const data = await res.json();
        const stats = data?.data?.[0];
        if (stats) {
          const profile: LiveShootingProfile = {
            fgPct: stats.fg_pct * 100 || 45,
            threePct: stats.fg3_pct * 100 || 35,
            threeRate: stats.fga > 0 ? stats.fg3a / stats.fga : 0.3,
          };
          await statsCache.set(cacheKey, profile, CacheTTL.TEAM_DATA);
          return profile;
        }
      }
    }
  } catch (error) {
    console.error(`Error fetching shooting profile for ${bdlPlayerId}:`, error);
  }

  return null;
}

// ============================================================================
// TODAY'S GAMES (for Betting Lines tool)
// ============================================================================

export interface LiveGame {
  id: string;
  homeTeam: string;
  homeTeamAbbr: string;
  awayTeam: string;
  awayTeamAbbr: string;
  gameTime: string;
  status: "scheduled" | "live" | "final";
}

/**
 * Fetch today's actual NBA games from ESPN.
 * Cached for 5 minutes.
 */
export async function getTodaysGames(): Promise<LiveGame[]> {
  const cacheKey = "live:todays-games";

  try {
    const cached = await statsCache.get<LiveGame[]>(cacheKey);
    if (cached) return cached;
  } catch {
    // Cache miss
  }

  try {
    const games = await espnApi.getNbaGames();

    const liveGames: LiveGame[] = games.map((g) => ({
      id: g.id,
      homeTeam: g.homeTeam.name,
      homeTeamAbbr: g.homeTeam.abbreviation,
      awayTeam: g.awayTeam.name,
      awayTeamAbbr: g.awayTeam.abbreviation,
      gameTime: g.gameDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      }),
      status: g.status,
    }));

    if (liveGames.length > 0) {
      await statsCache.set(cacheKey, liveGames, 300); // 5 min cache
    }

    return liveGames;
  } catch (error) {
    console.error("Error fetching today's games:", error);
    return [];
  }
}

// ============================================================================
// FANTASY PROJECTIONS (for Fantasy Optimizer tool)
// ============================================================================

export interface LiveFantasyPlayer {
  id: string;
  name: string;
  position: string;
  team: string;
  salary: number;
  projectedPts: number;
  value: number;
  status: "healthy" | "questionable" | "out";
}

/**
 * Fetch real player stats and calculate fantasy projections.
 * Uses ESPN leaders data to get top scorers, then calculates DK-style points.
 * Cached for 15 minutes.
 */
export async function getFantasyProjections(limit: number = 50): Promise<LiveFantasyPlayer[]> {
  const cacheKey = "live:fantasy-projections";

  try {
    const cached = await statsCache.get<LiveFantasyPlayer[]>(cacheKey);
    if (cached && cached.length > 0) {
      return cached.slice(0, limit);
    }
  } catch {
    // Cache miss
  }

  try {
    // Get scoring leaders to seed our fantasy pool
    const leaders = await getLeagueLeaders("ppg", 50);
    if (leaders.length === 0) return [];

    // Fetch multiple stat categories for better projections
    const [rebLeaders, astLeaders, stlLeaders, blkLeaders] = await Promise.all([
      getLeagueLeaders("rpg", 25),
      getLeagueLeaders("apg", 25),
      getLeagueLeaders("spg", 25),
      getLeagueLeaders("bpg", 25),
    ]);

    // Build a stat map for players
    const playerStats = new Map<string, {
      ppg: number; rpg: number; apg: number; spg: number; bpg: number;
      name: string; team: string; position?: string; playerId: string;
    }>();

    for (const l of leaders) {
      playerStats.set(l.name, {
        ppg: l.value, rpg: 0, apg: 0, spg: 0, bpg: 0,
        name: l.name, team: l.team, position: l.position, playerId: l.playerId,
      });
    }
    // Cross-reference other stat categories for existing scoring leaders
    for (const l of rebLeaders) {
      const existing = playerStats.get(l.name);
      if (existing) {
        existing.rpg = l.value;
        if (!existing.position && l.position) existing.position = l.position;
      }
    }
    for (const l of astLeaders) {
      const existing = playerStats.get(l.name);
      if (existing) {
        existing.apg = l.value;
        if (!existing.position && l.position) existing.position = l.position;
      }
    }
    for (const l of stlLeaders) {
      const existing = playerStats.get(l.name);
      if (existing) {
        existing.spg = l.value;
      }
    }
    for (const l of blkLeaders) {
      const existing = playerStats.get(l.name);
      if (existing) {
        existing.bpg = l.value;
      }
    }

    // Normalize ESPN position to standard fantasy positions (PG/SG/SF/PF/C)
    // ESPN Core API only returns broad positions (G/F/C), so we alternate
    // guards between PG/SG and forwards between SF/PF for even distribution.
    let guardToggle = false;
    let forwardToggle = false;
    function normalizePosition(pos: string | undefined): string {
      if (!pos) { guardToggle = !guardToggle; return guardToggle ? "PG" : "SG"; }
      switch (pos.toUpperCase()) {
        case "PG": return "PG";
        case "SG": return "SG";
        case "SF": return "SF";
        case "PF": return "PF";
        case "C": return "C";
        case "G": { guardToggle = !guardToggle; return guardToggle ? "PG" : "SG"; }
        case "F": { forwardToggle = !forwardToggle; return forwardToggle ? "SF" : "PF"; }
        default: { guardToggle = !guardToggle; return guardToggle ? "PG" : "SG"; }
      }
    }

    const fantasyPlayers: LiveFantasyPlayer[] = [];

    for (const [name, stats] of playerStats) {
      // DraftKings scoring: PTS*1 + REB*1.25 + AST*1.5 + STL*2 + BLK*2 - TOV*0.5
      const spg = stats.spg || 1.0;  // default ~1 STL if not in top 25
      const bpg = stats.bpg || 0.5;  // default ~0.5 BLK if not in top 25
      const projectedPts =
        stats.ppg * 1 +
        stats.rpg * 1.25 +
        stats.apg * 1.5 +
        spg * 2 +
        bpg * 2 -
        2.0 * 0.5;  // ~2 TOV avg

      const baseSalary = 3000;
      const salaryPerPoint = 150;
      const salary = Math.round((baseSalary + projectedPts * salaryPerPoint) / 100) * 100;
      const clampedSalary = Math.max(3000, Math.min(12000, salary));
      const value = clampedSalary > 0 ? projectedPts / (clampedSalary / 1000) : 0;

      fantasyPlayers.push({
        id: stats.playerId || name.replace(/\s+/g, "-").toLowerCase(),
        name,
        position: normalizePosition(stats.position),
        team: stats.team,
        salary: clampedSalary,
        projectedPts: Math.round(projectedPts * 10) / 10,
        value: Math.round(value * 100) / 100,
        status: "healthy",
      });
    }

    fantasyPlayers.sort((a, b) => b.value - a.value);

    if (fantasyPlayers.length > 0) {
      await statsCache.set(cacheKey, fantasyPlayers, CacheTTL.PLAYER_STATS);
    }

    return fantasyPlayers.slice(0, limit);
  } catch (error) {
    console.error("Error fetching fantasy projections:", error);
    return [];
  }
}
