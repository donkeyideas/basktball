import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const unreadOnly = searchParams.get("unread") === "true";

    const where: Record<string, unknown> = { userId };
    if (unreadOnly) where.read = false;
    if (cursor) where.createdAt = { lt: new Date(cursor) };

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
    });

    const hasMore = notifications.length > limit;
    if (hasMore) notifications.pop();

    return NextResponse.json({
      notifications,
      hasMore,
      nextCursor: notifications.length > 0 ? notifications[notifications.length - 1].createdAt.toISOString() : null,
    });
  } catch (error) {
    console.error("Fetch notifications error:", error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
