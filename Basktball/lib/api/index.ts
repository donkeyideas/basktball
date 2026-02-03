// Unified Basketball API with fallback strategy
// Primary: balldontlie.io (NBA only)
// Fallback: ESPN (all leagues)

import { nbaApi } from "./nba";
import { espnApi } from "./espn";
import { NormalizedGame, NormalizedPlayer, NormalizedTeam } from "./types";

export type League = "nba" | "wnba" | "ncaam" | "ncaaw" | "euro" | "intl";

export class BasketballApi {
  // Get games for a specific league and date
  async getGames(league: League, date?: string): Promise<NormalizedGame[]> {
    const dateStr = date || new Date().toISOString().split("T")[0];

    switch (league) {
      case "nba":
        // Try balldontlie first, fallback to ESPN
        try {
          const games = await nbaApi.getGamesByDate(dateStr);
          if (games.length > 0) return games;
        } catch (error) {
          console.warn("balldontlie failed, falling back to ESPN:", error);
        }
        return espnApi.getNbaGames(dateStr);

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

  // Get NBA teams
  async getTeams(): Promise<NormalizedTeam[]> {
    return nbaApi.getTeams();
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
}

// Export singleton
export const basketballApi = new BasketballApi();

// Re-export types
export * from "./types";
