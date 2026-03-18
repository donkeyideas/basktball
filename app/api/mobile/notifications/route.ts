import { NextResponse } from "next/server";
import { requireMobileUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  try {
    const user = await requireMobileUser(request);
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    const where: Record<string, unknown> = { userId: user.id };
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
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("Mobile notifications error:", error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireMobileUser(request);
    const body = await request.json();
    const { notificationId, markAllRead } = body;

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: { userId: user.id, read: false },
        data: { read: true },
      });
    } else if (notificationId) {
      await prisma.notification.updateMany({
        where: { id: notificationId, userId: user.id },
        data: { read: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
