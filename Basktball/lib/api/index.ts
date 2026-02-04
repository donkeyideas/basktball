// Unified Basketball API with fallback strategy
// Primary for games: ESPN (real-time scores, no rate limit)
// Primary for players/teams: balldontlie.io (detailed data)

import { nbaApi } from "./nba";
import { espnApi } from "./espn";
import { League, NormalizedGame, NormalizedPlayer, NormalizedTeam } from "./types";

export class BasketballApi {
  // Get games for a specific league and date
  // Uses ESPN as primary source for games (real-time scores, no rate limits)
  async getGames(league: League, date?: string): Promise<NormalizedGame[]> {
    // Note: Only pass date to ESPN if explicitly provided
    // ESPN determines "today" correctly on their end, avoiding UTC timezone issues

    switch (league) {
      case "nba":
        // ESPN is primary for live games (real-time scores, no rate limit)
        try {
          // Don't pass date unless explicitly provided - let ESPN determine "today"
          const games = await espnApi.getNbaGames(date);
          if (games.length > 0) return games;
        } catch (error) {
          console.warn("ESPN failed, trying balldontlie:", error);
        }
        // Fallback to balldontlie if ESPN fails
        try {
          const dateStr = date || new Date().toISOString().split("T")[0];
          return await nbaApi.getGamesByDate(dateStr);
        } catch (error) {
          console.error("Both APIs failed for games:", error);
          return [];
        }

      case "wnba":
        return espnApi.getWnbaGames(dateStr);

      case "ncaam":
        return espnApi.getNcaaMGames(dateStr);

      case "ncaaw":
        return espnApi.getNcaaWGames(dateStr);

      case "euro":
      case "intl":
        // No free API available for these leagues yet
        return [];

      default:
        return [];
    }
  }

  // Get today's games across all leagues
  async getTodaysGames(): Promise<Record<League, NormalizedGame[]>> {
    const [nba, wnba, ncaam, ncaaw] = await Promise.all([
      this.getGames("nba"),
      this.getGames("wnba"),
      this.getGames("ncaam"),
      this.getGames("ncaaw"),
    ]);

    return {
      nba,
      wnba,
      ncaam,
      ncaaw,
      euro: [],
      intl: [],
    };
  }

  // Get all live games
  async getLiveGames(): Promise<NormalizedGame[]> {
    const allGames = await this.getTodaysGames();
    const liveGames: NormalizedGame[] = [];

    Object.values(allGames).forEach((games) => {
      liveGames.push(...games.filter((g) => g.status === "live"));
    });

    return liveGames;
  }

  // Get teams by league
  async getTeamsByLeague(league: League): Promise<NormalizedTeam[]> {
    switch (league) {
      case "nba":
        return nbaApi.getTeams();
      case "wnba":
        return espnApi.getWnbaTeams();
      case "ncaam":
        return espnApi.getNcaaMTeams();
      case "ncaaw":
        return espnApi.getNcaaWTeams();
      case "euro":
      case "intl":
        // No free API available for these leagues yet
        return [];
      default:
        return [];
    }
  }

  // Get all teams across all supported leagues
  async getTeams(league?: League): Promise<NormalizedTeam[]> {
    // If specific league requested, return just that league
    if (league) {
      return this.getTeamsByLeague(league);
    }

    // Get teams from all leagues
    const [nba, wnba, ncaam, ncaaw] = await Promise.all([
      this.getTeamsByLeague("nba"),
      this.getTeamsByLeague("wnba"),
      this.getTeamsByLeague("ncaam"),
      this.getTeamsByLeague("ncaaw"),
    ]);

    // Add league identifier to each team
    const nbaTeams = nba.map((t) => ({ ...t, league: "nba" as League }));
    const wnbaTeams = wnba.map((t) => ({ ...t, league: "wnba" as League }));
    const ncaamTeams = ncaam.map((t) => ({ ...t, league: "ncaam" as League }));
    const ncaawTeams = ncaaw.map((t) => ({ ...t, league: "ncaaw" as League }));

    return [...nbaTeams, ...wnbaTeams, ...ncaamTeams, ...ncaawTeams];
  }

  // Get teams grouped by league
  async getTeamsGrouped(): Promise<Record<League, NormalizedTeam[]>> {
    const [nba, wnba, ncaam, ncaaw] = await Promise.all([
      this.getTeamsByLeague("nba"),
      this.getTeamsByLeague("wnba"),
      this.getTeamsByLeague("ncaam"),
      this.getTeamsByLeague("ncaaw"),
    ]);

    return {
      nba,
      wnba,
      ncaam,
      ncaaw,
      euro: [],
      intl: [],
    };
  }

  // Get single team
  async getTeam(teamId: string): Promise<NormalizedTeam | null> {
    return nbaApi.getTeam(teamId);
  }

  // Search players
  async searchPlayers(query: string): Promise<NormalizedPlayer[]> {
    return nbaApi.searchPlayers(query);
  }

  // Get player details
  async getPlayer(playerId: string): Promise<NormalizedPlayer | null> {
    return nbaApi.getPlayer(playerId);
  }

  // Get player season averages
  async getPlayerSeasonAverages(playerId: string, season?: number) {
    return nbaApi.getSeasonAverages(playerId, season);
  }

  // Get game box score
  async getGameStats(gameId: string) {
    return nbaApi.getGameStats(gameId);
  }

  // Get team roster (NBA only for now)
  async getTeamRoster(teamId: string, league: League = "nba") {
    if (league === "nba") {
      return nbaApi.getTeamRoster(teamId);
    }
    // ESPN doesn't have a simple roster endpoint for other leagues
    return [];
  }

  // Get team games/schedule (NBA only for now)
  async getTeamGames(teamId: string, league: League = "nba", options?: { season?: number }) {
    if (league === "nba") {
      return nbaApi.getTeamGames(teamId, options);
    }
    // Could add ESPN game fetching for other leagues
    return [];
  }

  // Get team stats (NBA only for now)
  async getTeamStats(teamId: string, league: League = "nba", season?: number) {
    if (league === "nba") {
      return nbaApi.getTeamStats(teamId, season);
    }
    return null;
  }
}

// Export singleton
export const basketballApi = new BasketballApi();

// Re-export types
export * from "./types";
