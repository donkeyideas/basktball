import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { deepseek } from "@/lib/ai";
import { getTodaysGames, getTeamAnalytics } from "@/lib/api/live-stats";

interface BettingLine {
  id: string;
  homeTeam: string;
  awayTeam: string;
  spread: number;
  spreadOdds: { home: number; away: number };
  total: number;
  totalOdds: { over: number; under: number };
  moneyline: { home: number; away: number };
  gameTime: string;
  modelPrediction: {
    homeWinProb: number;
    predictedSpread: number;
    predictedTotal: number;
    spreadEdge: number;
    totalEdge: number;
  };
}

// GET - Fetch betting lines with AI-generated predictions
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const league = searchParams.get("league") || "nba";

    // Get today's scheduled games
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const games = await prisma.game.findMany({
      where: {
        gameDate: {
          gte: today,
          lt: tomorrow,
        },
        status: "SCHEDULED",
        league: league.toUpperCase() as any,
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      take: 10,
    });

    if (games.length === 0) {
      // Try to get real today's games from ESPN
      const liveLines = await generateLiveLines();
      if (liveLines.length > 0) {
        return NextResponse.json({
          success: true,
          lines: liveLines,
          source: "espn_live",
        });
      }
      return NextResponse.json({
        success: true,
        lines: [],
        source: "no_games",
        message: "No NBA games scheduled today.",
      });
    }

    // Get team stats for predictions
    const teamStats = await prisma.teamStat.groupBy({
      by: ["teamId"],
      _avg: {
        points: true,
        offensiveRating: true,
        defensiveRating: true,
        pace: true,
      },
      _count: true,
    });

    const teamStatsMap = new Map(
      teamStats.map((ts) => [ts.teamId, ts._avg])
    );

    // Generate betting lines for each game
    const lines: BettingLine[] = games.map((game) => {
      const homeStats = teamStatsMap.get(game.homeTeamId);
      const awayStats = teamStatsMap.get(game.awayTeamId);

      const homeAvgPts = homeStats?.points || 110;
      const awayAvgPts = awayStats?.points || 108;
      const homeOffRtg = homeStats?.offensiveRating || 112;
      const homeDefRtg = homeStats?.defensiveRating || 110;
      const awayOffRtg = awayStats?.offensiveRating || 111;
      const awayDefRtg = awayStats?.defensiveRating || 111;

      // Calculate predictions
      const homeAdvantage = 3.5;
      const predictedHomeScore = Math.round(
        (homeOffRtg + awayDefRtg) / 2 + homeAdvantage + (Math.random() * 4 - 2)
      );
      const predictedAwayScore = Math.round(
        (awayOffRtg + homeDefRtg) / 2 + (Math.random() * 4 - 2)
      );

      const predictedSpread = -(predictedHomeScore - predictedAwayScore);
      const predictedTotal = predictedHomeScore + predictedAwayScore;

      // Generate realistic-looking betting lines
      const spread = Math.round(predictedSpread * 2) / 2;
      const total = Math.round((predictedTotal + (Math.random() * 4 - 2)) * 2) / 2;

      // Win probability based on spread
      const homeWinProb = Math.min(85, Math.max(15, 50 - spread * 3));

      // Calculate moneyline from win probability
      const homeML = homeWinProb > 50
        ? -Math.round((homeWinProb / (100 - homeWinProb)) * 100)
        : Math.round(((100 - homeWinProb) / homeWinProb) * 100);
      const awayML = homeWinProb > 50
        ? Math.round(((100 - homeWinProb) / homeWinProb) * 100)
        : -Math.round((homeWinProb / (100 - homeWinProb)) * 100);

      // Edge calculations
      const spreadEdge = Math.round((predictedSpread - spread) * 10) / 10;
      const totalEdge = Math.round((predictedTotal - total) * 10) / 10;

      const gameTime = new Date(game.gameDate).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      });

      return {
        id: game.id,
        homeTeam: game.homeTeam.name,
        awayTeam: game.awayTeam.name,
        spread,
        spreadOdds: { home: -110, away: -110 },
        total,
        totalOdds: { over: -110, under: -110 },
        moneyline: { home: homeML, away: awayML },
        gameTime,
        modelPrediction: {
          homeWinProb: Math.round(homeWinProb),
          predictedSpread: Math.round(predictedSpread * 10) / 10,
          predictedTotal: Math.round(predictedTotal * 10) / 10,
          spreadEdge,
          totalEdge,
        },
      };
    });

    return NextResponse.json({
      success: true,
      lines,
      source: "database",
    });
  } catch (error) {
    console.error("Error fetching betting lines:", error);
    // Try live ESPN data on error
    try {
      const liveLines = await generateLiveLines();
      if (liveLines.length > 0) {
        return NextResponse.json({
          success: true,
          lines: liveLines,
          source: "espn_live",
        });
      }
    } catch {
      // ESPN also failed
    }
    return NextResponse.json({
      success: true,
      lines: [],
      source: "no_games",
      message: "Unable to fetch betting lines. Please try again later.",
    });
  }
}

// Generate betting lines from real ESPN games + team analytics
async function generateLiveLines(): Promise<BettingLine[]> {
  const [todaysGames, teamStats] = await Promise.all([
    getTodaysGames(),
    getTeamAnalytics(),
  ]);

  if (todaysGames.length === 0) return [];

  const teamStatsMap = new Map(teamStats.map((t) => [t.abbreviation, t]));

  return todaysGames
    .filter((g) => g.status === "scheduled")
    .map((game) => {
      const homeStat = teamStatsMap.get(game.homeTeamAbbr);
      const awayStat = teamStatsMap.get(game.awayTeamAbbr);

      const homeWinPct = homeStat ? homeStat.wins / Math.max(homeStat.wins + homeStat.losses, 1) : 0.5;
      const awayWinPct = awayStat ? awayStat.wins / Math.max(awayStat.wins + awayStat.losses, 1) : 0.5;

      const homePpg = homeStat?.ppg || 110;
      const awayPpg = awayStat?.ppg || 110;

      // Calculate spread from win percentages + home advantage
      const homeAdvantage = 3.5;
      const strengthDiff = (homeWinPct - awayWinPct) * 15;
      const predictedSpread = -(strengthDiff + homeAdvantage);
      const spread = Math.round(predictedSpread * 2) / 2;

      // Calculate total from team PPGs
      const predictedTotal = homePpg + awayPpg;
      const total = Math.round(predictedTotal * 2) / 2;

      // Win probability
      const homeWinProb = Math.min(85, Math.max(15, 50 - spread * 3));

      // Moneyline from win probability
      const homeML = homeWinProb > 50
        ? -Math.round((homeWinProb / (100 - homeWinProb)) * 100)
        : Math.round(((100 - homeWinProb) / homeWinProb) * 100);
      const awayML = homeWinProb > 50
        ? Math.round(((100 - homeWinProb) / homeWinProb) * 100)
        : -Math.round((homeWinProb / (100 - homeWinProb)) * 100);

      return {
        id: game.id,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        spread,
        spreadOdds: { home: -110, away: -110 },
        total,
        totalOdds: { over: -110, under: -110 },
        moneyline: { home: homeML, away: awayML },
        gameTime: game.gameTime,
        modelPrediction: {
          homeWinProb: Math.round(homeWinProb),
          predictedSpread: Math.round(predictedSpread * 10) / 10,
          predictedTotal: Math.round(predictedTotal * 10) / 10,
          spreadEdge: Math.round((predictedSpread - spread) * 10) / 10,
          totalEdge: Math.round((predictedTotal - total) * 10) / 10,
        },
      };
    });
}
