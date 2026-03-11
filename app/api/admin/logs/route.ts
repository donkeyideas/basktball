import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const level = params.get("level") || "all"; // all | info | warn | error
    const endpoint = params.get("endpoint") || "";
    const page = parseInt(params.get("page") || "1");
    const limit = Math.min(parseInt(params.get("limit") || "50"), 100);
    const offset = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (level === "error") {
      where.statusCode = { gte: 500 };
    } else if (level === "warn") {
      where.statusCode = { gte: 400, lt: 500 };
    } else if (level === "info") {
      where.statusCode = { lt: 400 };
    }

    if (endpoint) {
      where.endpoint = { contains: endpoint };
    }

    const [logs, totalCount] = await Promise.all([
      prisma.apiLog.findMany({
        where,
        orderBy: { timestamp: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.apiLog.count({ where }),
    ]);

    // Compute summary stats
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentLogs = await prisma.apiLog.findMany({
      where: { timestamp: { gte: oneDayAgo } },
      select: { statusCode: true },
    });

    const summary = {
      total24h: recentLogs.length,
      info24h: recentLogs.filter((l) => l.statusCode < 400).length,
      warn24h: recentLogs.filter((l) => l.statusCode >= 400 && l.statusCode < 500).length,
      error24h: recentLogs.filter((l) => l.statusCode >= 500).length,
    };

    // Get distinct endpoints for filter dropdown
    const endpoints = await prisma.apiLog.groupBy({
      by: ["endpoint"],
      _count: true,
      orderBy: { _count: { endpoint: "desc" } },
      take: 30,
    });

    return NextResponse.json({
      success: true,
      logs: logs.map((l) => ({
        id: l.id,
        endpoint: l.endpoint,
        method: l.method,
        statusCode: l.statusCode,
        responseTime: l.responseTime,
        error: l.error,
        timestamp: l.timestamp.toISOString(),
        level: l.statusCode >= 500 ? "error" : l.statusCode >= 400 ? "warn" : "info",
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      summary,
      endpoints: endpoints.map((e) => ({ endpoint: e.endpoint, count: e._count })),
    });
  } catch (error) {
    console.error("Logs API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}
