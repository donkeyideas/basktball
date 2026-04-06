import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "";
    const pushed = searchParams.get("pushed");
    const read = searchParams.get("read");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "30");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (type) {
      where.type = type;
    }
    if (pushed === "true") where.pushed = true;
    if (pushed === "false") where.pushed = false;
    if (read === "true") where.read = true;
    if (read === "false") where.read = false;

    // Fetch notifications with pagination
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, displayName: true, email: true },
          },
        },
      }),
      prisma.notification.count({ where }),
    ]);

    // Aggregate stats
    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [
      totalCount,
      pushedCount,
      readCount,
      byType,
      recentNotifications,
    ] = await Promise.all([
      prisma.notification.count(),
      prisma.notification.count({ where: { pushed: true } }),
      prisma.notification.count({ where: { read: true } }),
      prisma.notification.groupBy({
        by: ["type"],
        _count: { type: true },
        orderBy: { _count: { type: "desc" } },
      }),
      prisma.notification.findMany({
        where: { createdAt: { gte: fourteenDaysAgo } },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    // Build daily chart data
    const dailyMap: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      dailyMap[key] = 0;
    }
    for (const n of recentNotifications) {
      const key = n.createdAt.toISOString().split("T")[0];
      if (dailyMap[key] !== undefined) dailyMap[key]++;
    }
    const dailyData = Object.entries(dailyMap).map(([date, count]) => ({
      date,
      count,
    }));

    return NextResponse.json({
      success: true,
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        total: totalCount,
        pushed: pushedCount,
        read: readCount,
        unread: totalCount - readCount,
        byType: byType.map((t) => ({ type: t.type, count: t._count.type })),
        dailyData,
      },
    });
  } catch (error) {
    console.error("Admin notifications error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
