import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const provider = params.get("provider") || "";
    const cached = params.get("cached");
    const search = params.get("search") || "";
    const dateFrom = params.get("dateFrom");
    const dateTo = params.get("dateTo");
    const sort = params.get("sort") || "createdAt";
    const order = params.get("order") || "desc";
    const page = parseInt(params.get("page") || "1");
    const limit = Math.min(parseInt(params.get("limit") || "50"), 100);
    const offset = (page - 1) * limit;

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (provider) where.provider = provider;
    if (cached === "true") where.cached = true;
    if (cached === "false") where.cached = false;
    if (search) {
      where.OR = [
        { endpoint: { contains: search, mode: "insensitive" } },
        { callerRoute: { contains: search, mode: "insensitive" } },
      ];
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [calls, totalCount, recent24h, last14d] = await Promise.all([
      prisma.apiTracker.findMany({
        where,
        orderBy: { [sort]: order },
        take: limit,
        skip: offset,
      }),
      prisma.apiTracker.count({ where }),
      prisma.apiTracker.findMany({
        where: { createdAt: { gte: twentyFourHoursAgo } },
        select: {
          provider: true,
          statusCode: true,
          responseTime: true,
          estimatedCost: true,
          cached: true,
          error: true,
        },
      }),
      prisma.apiTracker.findMany({
        where: { createdAt: { gte: fourteenDaysAgo } },
        select: {
          provider: true,
          estimatedCost: true,
          cached: true,
          createdAt: true,
          statusCode: true,
        },
      }),
    ]);

    // 24h stats
    const totalCalls = recent24h.length;
    const totalCost = recent24h.reduce((s, r) => s + r.estimatedCost, 0);
    const cacheHits = recent24h.filter((r) => r.cached).length;
    const cacheHitRate = totalCalls > 0 ? (cacheHits / totalCalls) * 100 : 0;
    const avgResponseTime =
      totalCalls > 0
        ? Math.round(
            recent24h.reduce((s, r) => s + r.responseTime, 0) / totalCalls
          )
        : 0;
    const errorCount = recent24h.filter(
      (r) => r.error || r.statusCode >= 400
    ).length;
    const errorRate =
      totalCalls > 0 ? (errorCount / totalCalls) * 100 : 0;
    const activeProviders = new Set(recent24h.map((r) => r.provider)).size;

    // Calls by provider (24h)
    const providerMap = new Map<string, number>();
    recent24h.forEach((r) => {
      providerMap.set(r.provider, (providerMap.get(r.provider) || 0) + 1);
    });
    const callsByProvider = Array.from(providerMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Daily volume (14 days)
    const dailyVolume = [];
    for (let i = 13; i >= 0; i--) {
      const dayStart = new Date(now.getTime() - i * 86400000);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const dayLogs = last14d.filter(
        (l) => l.createdAt >= dayStart && l.createdAt < dayEnd
      );
      dailyVolume.push({
        date: dayStart.toISOString().split("T")[0],
        calls: dayLogs.length,
        errors: dayLogs.filter((l) => l.statusCode >= 400).length,
      });
    }

    // Cost trend (14 days)
    const costTrend = [];
    for (let i = 13; i >= 0; i--) {
      const dayStart = new Date(now.getTime() - i * 86400000);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const dayLogs = last14d.filter(
        (l) => l.createdAt >= dayStart && l.createdAt < dayEnd
      );
      costTrend.push({
        date: dayStart.toISOString().split("T")[0],
        cost: dayLogs.reduce((s, l) => s + l.estimatedCost, 0),
      });
    }

    return NextResponse.json({
      success: true,
      calls,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      stats: {
        totalCalls,
        totalCost: Math.round(totalCost * 10000) / 10000,
        cacheHitRate: Math.round(cacheHitRate * 10) / 10,
        avgResponseTime,
        errorCount,
        errorRate: Math.round(errorRate * 10) / 10,
        activeProviders,
      },
      callsByProvider,
      dailyVolume,
      costTrend,
    });
  } catch (error) {
    console.error("API Tracker route error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch API tracker data" },
      { status: 500 }
    );
  }
}
