// Job Handlers
// Individual job implementations for background tasks

import { JobResult } from "./runner";
import { basketballApi } from "@/lib/api";
import { gamesCache, CacheTTL, CacheKeys, insightsCache } from "@/lib/cache";
import { prisma } from "@/lib/db/prisma";
import { generateGameRecap, generatePlayerAnalysis } from "@/lib/ai";

// =============================================================================
// FETCH LIVE SCORES
// Runs every 2 minutes during game hours to update live game data
// =============================================================================
export async function fetchLiveScores(): Promise<JobResult> {
  try {
    const leagues = ["nba", "wnba", "ncaam", "ncaaw"] as const;
    let totalGames = 0;
    let liveGames = 0;

    for (const league of leagues) {
      const games = await basketballApi.getGames(league);
      totalGames += games.length;

      const live = games.filter((g) => g.status === "live");
      liveGames += live.length;

      // Cache the games
      const today = new Date().toISOString().split("T")[0];
      await gamesCache.set(
        CacheKeys.gamesByDate(league, today),
        games,
        CacheTTL.LIVE_SCORES
      );

      // Also cache live games specifically
      if (live.length > 0) {
        await gamesCache.set(
          CacheKeys.liveGames(league),
          live,
          CacheTTL.LIVE_SCORES
        );
      }

      // Upsert games to database
      for (const game of games) {
        // First, ensure both teams exist in the database
        await prisma.team.upsert({
          where: { id: game.homeTeam.id },
          create: {
            id: game.homeTeam.id,
            name: game.homeTeam.name,
            abbreviation: game.homeTeam.abbreviation,
            city: game.homeTeam.city || "",
            logoUrl: game.homeTeam.logoUrl,
            league: league.toUpperCase() as "NBA" | "WNBA" | "NCAAM" | "NCAAW",
          },
          update: {
            name: game.homeTeam.name,
            abbreviation: game.homeTeam.abbreviation,
            logoUrl: game.homeTeam.logoUrl,
          },
        });

        await prisma.team.upsert({
          where: { id: game.awayTeam.id },
          create: {
            id: game.awayTeam.id,
            name: game.awayTeam.name,
            abbreviation: game.awayTeam.abbreviation,
            city: game.awayTeam.city || "",
            logoUrl: game.awayTeam.logoUrl,
            league: league.toUpperCase() as "NBA" | "WNBA" | "NCAAM" | "NCAAW",
          },
          update: {
            name: game.awayTeam.name,
            abbreviation: game.awayTeam.abbreviation,
            logoUrl: game.awayTeam.logoUrl,
          },
        });

        // Now upsert the game
        await prisma.game.upsert({
          where: { id: game.id },
          create: {
            id: game.id,
            homeTeamId: game.homeTeam.id,
            awayTeamId: game.awayTeam.id,
            gameDate: game.gameDate,
            status: game.status.toUpperCase() as "SCHEDULED" | "LIVE" | "FINAL",
            homeScore: game.homeScore,
            awayScore: game.awayScore,
            quarter: game.quarter,
            clock: game.clock,
            league: league.toUpperCase() as "NBA" | "WNBA" | "NCAAM" | "NCAAW",
            isPlayoffs: game.isPlayoffs,
          },
          update: {
            status: game.status.toUpperCase() as "SCHEDULED" | "LIVE" | "FINAL",
            homeScore: game.homeScore,
            awayScore: game.awayScore,
            quarter: game.quarter,
            clock: game.clock,
          },
        });
      }
    }

    return {
      success: true,
      itemsProcessed: totalGames,
      message: `Fetched ${totalGames} games (${liveGames} live)`,
      metadata: { totalGames, liveGames },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// =============================================================================
// DAILY DATA SYNC
// Runs daily at 5 AM to sync teams and players
// =============================================================================
export async function dailyDataSync(): Promise<JobResult> {
  try {
    let teamsProcessed = 0;
    let playersProcessed = 0;

    // Sync teams
    const teams = await basketballApi.getTeams();
    for (const team of teams) {
      await prisma.team.upsert({
        where: { id: team.id },
        create: {
          id: team.id,
          name: team.name,
          abbreviation: team.abbreviation,
          city: team.city,
          logoUrl: team.logoUrl,
          league: "NBA",
          conference: team.conference,
          division: team.division,
        },
        update: {
          name: team.name,
          abbreviation: team.abbreviation,
          city: team.city,
          logoUrl: team.logoUrl,
          conference: team.conference,
          division: team.division,
        },
      });
      teamsProcessed++;
    }

    // Note: Player sync would be done here if we had full player data
    // For now, players are synced on-demand when viewing player pages

    return {
      success: true,
      itemsProcessed: teamsProcessed + playersProcessed,
      message: `Synced ${teamsProcessed} teams, ${playersProcessed} players`,
      metadata: { teamsProcessed, playersProcessed },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// =============================================================================
// GENERATE AI INSIGHTS
// Runs daily at 6 AM to generate AI content for completed games
// =============================================================================
export async function generateAiInsights(): Promise<JobResult> {
  try {
    let insightsGenerated = 0;

    // Get recent completed games (last 7 days) that don't have recaps
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const gamesWithoutRecaps = await prisma.game.findMany({
      where: {
        status: "FINAL",
        gameDate: {
          gte: sevenDaysAgo,
        },
        insights: {
          none: {
            type: "GAME_RECAP",
          },
        },
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: { gameDate: "desc" },
      take: 10, // Limit to 10 per run to manage API costs
    });

    for (const game of gamesWithoutRecaps) {
      try {
        // Generate game recap
        const recap = await generateGameRecap({
          homeTeam: game.homeTeam.name,
          awayTeam: game.awayTeam.name,
          homeScore: game.homeScore || 0,
          awayScore: game.awayScore || 0,
          isPlayoffs: game.isPlayoffs,
        });

        // Store in database
        await prisma.aiInsight.create({
          data: {
            type: "GAME_RECAP",
            title: `${game.awayTeam.abbreviation} vs ${game.homeTeam.abbreviation} Recap`,
            content: recap.content,
            summary: recap.summary,
            gameId: game.id,
            confidence: recap.confidence,
            tokenUsage: recap.tokensUsed,
            approved: recap.confidence >= 0.8,
          },
        });

        // Cache the insight
        await insightsCache.set(
          CacheKeys.insight("game_recap", game.id),
          recap,
          CacheTTL.AI_INSIGHTS
        );

        insightsGenerated++;
      } catch (error) {
        console.error(`Failed to generate recap for game ${game.id}:`, error);
      }
    }

    return {
      success: true,
      itemsProcessed: insightsGenerated,
      message: `Generated ${insightsGenerated} AI insights`,
      metadata: { insightsGenerated, gamesProcessed: gamesWithoutRecaps.length },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// =============================================================================
// UPDATE STANDINGS
// Runs every 4 hours to update league standings
// =============================================================================
export async function updateStandings(): Promise<JobResult> {
  try {
    // Standings would be calculated from game results
    // For now, this is a placeholder

    return {
      success: true,
      itemsProcessed: 0,
      message: "Standings update placeholder",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// =============================================================================
// CLEANUP CACHE
// Runs every 6 hours to clear expired cache entries
// =============================================================================
export async function cleanupCache(): Promise<JobResult> {
  try {
    // Delete old insights from database (keep last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deletedInsights = await prisma.aiInsight.deleteMany({
      where: {
        generatedAt: { lt: thirtyDaysAgo },
        published: false,
      },
    });

    // Delete old job runs (keep last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const deletedJobRuns = await prisma.jobRun.deleteMany({
      where: {
        startedAt: { lt: sevenDaysAgo },
      },
    });

    // Delete old API logs (keep last 3 days)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const deletedApiLogs = await prisma.apiLog.deleteMany({
      where: {
        timestamp: { lt: threeDaysAgo },
      },
    });

    return {
      success: true,
      itemsProcessed: deletedInsights.count + deletedJobRuns.count + deletedApiLogs.count,
      message: `Cleaned up ${deletedInsights.count} insights, ${deletedJobRuns.count} job runs, ${deletedApiLogs.count} API logs`,
      metadata: {
        deletedInsights: deletedInsights.count,
        deletedJobRuns: deletedJobRuns.count,
        deletedApiLogs: deletedApiLogs.count,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// =============================================================================
// GENERATE PLAYER SPOTLIGHTS
// Runs daily at 4 PM to generate fantasy/analysis content for top performers
// =============================================================================
export async function generatePlayerSpotlights(): Promise<JobResult> {
  try {
    let spotlightsGenerated = 0;

    // Get top performers from recent games
    // This would query player stats and find standout performances
    // For now, placeholder implementation

    return {
      success: true,
      itemsProcessed: spotlightsGenerated,
      message: `Generated ${spotlightsGenerated} player spotlights`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
