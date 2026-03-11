import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "ALL";
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sort = searchParams.get("sort") || "createdAt";
    const order = searchParams.get("order") || "desc";

    // Build where clause
    const where: Record<string, unknown> = {};

    if (status !== "ALL") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
      ];
    }

    const [messages, total, unreadCount] = await Promise.all([
      prisma.contactMessage.findMany({
        where,
        orderBy: { [sort]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contactMessage.count({ where }),
      prisma.contactMessage.count({ where: { status: "UNREAD" } }),
    ]);

    // Stats
    const [totalMessages, readCount, repliedCount, archivedCount] =
      await Promise.all([
        prisma.contactMessage.count(),
        prisma.contactMessage.count({ where: { status: "READ" } }),
        prisma.contactMessage.count({ where: { status: "REPLIED" } }),
        prisma.contactMessage.count({ where: { status: "ARCHIVED" } }),
      ]);

    return NextResponse.json({
      success: true,
      messages,
      stats: {
        total: totalMessages,
        unread: unreadCount,
        read: readCount,
        replied: repliedCount,
        archived: archivedCount,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching inbox:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
