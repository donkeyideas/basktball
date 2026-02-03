import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { cache } from "@/lib/cache/redis";

export const dynamic = "force-dynamic";

interface SystemStatus {
  api: "healthy" | "degraded" | "down";
  database: "healthy" | "degraded" | "down";
  aiService: "healthy" | "degraded" | "down";
  cache: "healthy" | "degraded" | "down";
}

async function checkSystemStatus(): Promise<SystemStatus> {
  const status: SystemStatus = {
    api: "healthy",
    database: "down",
    aiService: "healthy",
    cache: "down",
  };

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`;
    status.database = "healthy";
  } catch {
    status.database = "down";
  }

  // Check cache
  try {
    await cache.set("health-check", "ok", 10);
    const result = await cache.get("health-check");
    status.cache = result === "ok" ? "healthy" : "degraded";
  } catch {
    status.cache = "down";
  }

  // Check AI service (just check if key exists)
  status.aiService = process.env.DEEPSEEK_API_KEY ? "healthy" : "down";

  return status;
}

export async function GET() {
  try {
    // Get system status
    const status = await checkSystemStatus();

    // Get counts from database
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      totalGames,
      totalPlayers,
      totalInsights,
      pendingReviews,
      apiLogs24h,
      recentJobRuns,
      recentInsights,
    ] = await Promise.all([
      prisma.game.count(),
      prisma.player.count(),
      prisma.aiInsight.count(),
      prisma.aiInsight.count({ where: { approved: false } }),
      prisma.apiLog.count({
        where: { timestamp: { gte: twentyFourHoursAgo } },
      }),
      prisma.jobRun.findMany({
        orderBy: { startedAt: "desc" },
        take: 10,
      }),
      prisma.aiInsight.findMany({
        orderBy: { generatedAt: "desc" },
        take: 5,
        include: {
          player: { select: { name: true } },
          game: {
            select: {
              homeTeam: { select: { abbreviation: true } },
              awayTeam: { select: { abbreviation: true } },
            },
          },
        },
      }),
    ]);

    // Calculate token usage (sum from recent insights)
    const tokenUsageResult = await prisma.aiInsight.aggregate({
      _sum: { tokenUsage: true },
      where: { generatedAt: { gte: twentyFourHoursAgo } },
    });

    // Format recent activity from jobs and insights
    const recentActivity = [
      ...recentInsights.map((insight) => {
        const gameInfo = insight.game
          ? `${insight.game.homeTeam.abbreviation} vs ${insight.game.awayTeam.abbreviation}`
          : insight.player?.name || "";
        return {
          id: insight.id,
          type: "insight" as const,
          message: `Generated ${insight.type.toLowerCase().replace("_", " ")}: ${gameInfo}`,
          time: formatTimeAgo(insight.generatedAt),
        };
      }),
      ...recentJobRuns.map((job) => ({
        id: job.id,
        type: "job" as const,
        message: `${job.jobName} ${job.status.toLowerCase()}`,
        time: formatTimeAgo(job.startedAt),
      })),
    ]
      .sort((a, b) => {
        const aTime = parseTimeAgo(a.time);
        const bTime = parseTimeAgo(b.time);
        return aTime - bTime;
      })
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      status,
      stats: {
        totalGames,
        totalPlayers,
        totalInsights,
        pendingReviews,
        apiCalls24h: apiLogs24h,
        aiTokensUsed: tokenUsageResult._sum.tokenUsage || 0,
      },
      recentActivity,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

function parseTimeAgo(timeStr: string): number {
  if (timeStr === "just now") return 0;
  const match = timeStr.match(/(\d+)\s+(min|hour|day)/);
  if (!match) return Infinity;
  const value = parseInt(match[1]);
  const unit = match[2];
  switch (unit) {
    case "min":
      return value;
    case "hour":
      return value * 60;
    case "day":
      return value * 1440;
    default:
      return Infinity;
  }
}
