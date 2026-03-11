import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";
    const sort = searchParams.get("sort") || "createdAt";
    const order = searchParams.get("order") || "desc";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { displayName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    // Build orderBy
    const validSortFields = ["createdAt", "name", "email", "role", "status", "postCount", "threadCount", "reputation", "lastActiveAt"];
    const sortField = validSortFields.includes(sort) ? sort : "createdAt";
    const orderBy = { [sortField]: order === "asc" ? "asc" : "desc" };

    // Fetch users + total count in parallel
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          displayName: true,
          avatarUrl: true,
          image: true,
          role: true,
          status: true,
          postCount: true,
          threadCount: true,
          reputation: true,
          lastActiveAt: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    // KPI stats
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalUsers, newUsers7d, activeUsers7d, bannedSuspended] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.user.count({ where: { lastActiveAt: { gte: sevenDaysAgo } } }),
      prisma.user.count({ where: { status: { in: ["BANNED", "SUSPENDED"] } } }),
    ]);

    // Signups by day (last 14 days)
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const recentUsers = await prisma.user.findMany({
      where: { createdAt: { gte: fourteenDaysAgo } },
      select: { createdAt: true },
    });

    const signupsByDay: { date: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      const count = recentUsers.filter((u) => {
        const d = u.createdAt.toISOString().split("T")[0];
        return d === dateStr;
      }).length;
      signupsByDay.push({ date: dateStr, count });
    }

    // Role distribution
    const roleGroups = await prisma.user.groupBy({
      by: ["role"],
      _count: { role: true },
    });
    const roleDistribution = roleGroups.map((g) => ({
      role: g.role,
      count: g._count.role,
    }));

    return NextResponse.json({
      success: true,
      users,
      stats: {
        total: totalUsers,
        new7d: newUsers7d,
        active7d: activeUsers7d,
        bannedSuspended,
      },
      signupsByDay,
      roleDistribution,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin users API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
