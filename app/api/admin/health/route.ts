import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { cache } from "@/lib/cache/redis";

export const dynamic = "force-dynamic";

interface ServiceCheck {
  name: string;
  status: "healthy" | "degraded" | "down";
  responseTime: number;
  detail?: string;
}

async function checkWithTiming<T>(
  fn: () => Promise<T>,
  timeoutMs = 5000
): Promise<{ result: T | null; elapsed: number; error: string | null }> {
  const start = Date.now();
  try {
    const result = await Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), timeoutMs)
      ),
    ]);
    return { result, elapsed: Date.now() - start, error: null };
  } catch (e) {
    return {
      result: null,
      elapsed: Date.now() - start,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export async function GET() {
  try {
    // Run all checks in parallel
    const [dbCheck, cacheCheck, espnNbaCheck, espnWnbaCheck, espnNcaaCheck, bdlCheck] =
      await Promise.all([
        // Database
        checkWithTiming(async () => {
          await prisma.$queryRaw`SELECT 1`;
          return true;
        }),
        // Redis cache
        checkWithTiming(async () => {
          const key = `health:${Date.now()}`;
          await cache.set(key, "ok", 10);
          const val = await cache.get(key);
          return val === "ok";
        }),
        // ESPN NBA
        checkWithTiming(async () => {
          const res = await fetch(
            "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard",
            { cache: "no-store" }
          );
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return true;
        }),
        // ESPN WNBA
        checkWithTiming(async () => {
          const res = await fetch(
            "https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard",
            { cache: "no-store" }
          );
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return true;
        }),
        // ESPN NCAA
        checkWithTiming(async () => {
          const res = await fetch(
            "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard",
            { cache: "no-store" }
          );
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return true;
        }),
        // BallDontLie
        checkWithTiming(async () => {
          const headers: Record<string, string> = {};
          if (process.env.BALLDONTLIE_API_KEY) {
            headers["Authorization"] = process.env.BALLDONTLIE_API_KEY;
          }
          const res = await fetch("https://api.balldontlie.io/v1/teams", {
            headers,
            cache: "no-store",
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return true;
        }),
      ]);

    function toStatus(
      check: { result: unknown; elapsed: number; error: string | null },
      slowThresholdMs = 2000
    ): ServiceCheck["status"] {
      if (check.error) return "down";
      if (check.elapsed > slowThresholdMs) return "degraded";
      return "healthy";
    }

    const internal: ServiceCheck[] = [
      {
        name: "PostgreSQL",
        status: toStatus(dbCheck, 1000),
        responseTime: dbCheck.elapsed,
        detail: dbCheck.error || "Primary database",
      },
      {
        name: "Redis Cache",
        status: toStatus(cacheCheck, 500),
        responseTime: cacheCheck.elapsed,
        detail: cacheCheck.error || "Upstash Redis",
      },
      {
        name: "DeepSeek AI",
        status: process.env.DEEPSEEK_API_KEY ? "healthy" : "down",
        responseTime: 0,
        detail: process.env.DEEPSEEK_API_KEY
          ? "API key configured"
          : "DEEPSEEK_API_KEY not set",
      },
    ];

    const external: ServiceCheck[] = [
      {
        name: "ESPN NBA",
        status: toStatus(espnNbaCheck),
        responseTime: espnNbaCheck.elapsed,
        detail: espnNbaCheck.error || "NBA scoreboard API",
      },
      {
        name: "ESPN WNBA",
        status: toStatus(espnWnbaCheck),
        responseTime: espnWnbaCheck.elapsed,
        detail: espnWnbaCheck.error || "WNBA scoreboard API",
      },
      {
        name: "ESPN NCAA",
        status: toStatus(espnNcaaCheck),
        responseTime: espnNcaaCheck.elapsed,
        detail: espnNcaaCheck.error || "NCAA basketball API",
      },
      {
        name: "BallDontLie",
        status: toStatus(bdlCheck),
        responseTime: bdlCheck.elapsed,
        detail: bdlCheck.error || "NBA stats API",
      },
    ];

    // Get API usage stats from logs
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [logs24h, logs7d] = await Promise.all([
      prisma.apiLog.findMany({
        where: { timestamp: { gte: twentyFourHoursAgo } },
        select: { endpoint: true, responseTime: true, statusCode: true, timestamp: true },
      }),
      prisma.apiLog.findMany({
        where: { timestamp: { gte: sevenDaysAgo } },
        select: { endpoint: true, responseTime: true, statusCode: true, timestamp: true },
      }),
    ]);

    const totalCalls24h = logs24h.length;
    const errors24h = logs24h.filter((l) => l.statusCode >= 400).length;
    const errorRate24h = totalCalls24h > 0 ? (errors24h / totalCalls24h) * 100 : 0;
    const avgResponse24h =
      totalCalls24h > 0
        ? Math.round(logs24h.reduce((s, l) => s + l.responseTime, 0) / totalCalls24h)
        : 0;

    // Daily breakdown for the chart (last 7 days)
    const dailyStats: Array<{
      date: string;
      calls: number;
      errors: number;
      avgResponse: number;
    }> = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getTime() - i * 86400000);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const dayLogs = logs7d.filter(
        (l) => l.timestamp >= dayStart && l.timestamp < dayEnd
      );
      dailyStats.push({
        date: dayStart.toISOString().split("T")[0],
        calls: dayLogs.length,
        errors: dayLogs.filter((l) => l.statusCode >= 400).length,
        avgResponse:
          dayLogs.length > 0
            ? Math.round(dayLogs.reduce((s, l) => s + l.responseTime, 0) / dayLogs.length)
            : 0,
      });
    }

    // Top endpoints by call count (24h)
    const endpointMap = new Map<string, { calls: number; errors: number; totalTime: number }>();
    logs24h.forEach((l) => {
      const entry = endpointMap.get(l.endpoint) || { calls: 0, errors: 0, totalTime: 0 };
      entry.calls++;
      if (l.statusCode >= 400) entry.errors++;
      entry.totalTime += l.responseTime;
      endpointMap.set(l.endpoint, entry);
    });
    const topEndpoints = Array.from(endpointMap.entries())
      .map(([endpoint, data]) => ({
        endpoint,
        calls: data.calls,
        errors: data.errors,
        avgResponse: Math.round(data.totalTime / data.calls),
      }))
      .sort((a, b) => b.calls - a.calls)
      .slice(0, 10);

    const allServices = [...internal, ...external];
    const overallStatus = allServices.every((s) => s.status === "healthy")
      ? "healthy"
      : allServices.some((s) => s.status === "down")
        ? "degraded"
        : "degraded";

    return NextResponse.json({
      success: true,
      overallStatus,
      internal,
      external,
      apiUsage: {
        totalCalls24h,
        errors24h,
        errorRate24h: parseFloat(errorRate24h.toFixed(1)),
        avgResponse24h,
        dailyStats,
        topEndpoints,
      },
      checkedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      { success: false, error: "Health check failed" },
      { status: 500 }
    );
  }
}
