import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// GET /api/mobile/users/[id]/takes - Get a user's takes
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Number(searchParams.get("limit")) || 30, 50);
    const includeReplies = searchParams.get("replies") === "true";

    const takes = await prisma.take.findMany({
      where: {
        authorId: id,
        isDeleted: false,
        ...(includeReplies ? {} : { parentId: null }),
      },
      select: {
        id: true,
        content: true,
        fireCount: true,
        brickCount: true,
        replyCount: true,
        repostCount: true,
        createdAt: true,
        parentId: true,
        tags: true,
        author: {
          select: {
            id: true,
            name: true,
            displayName: true,
            image: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = takes.length > limit;
    const items = hasMore ? takes.slice(0, limit) : takes;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return NextResponse.json({ takes: items, nextCursor, hasMore });
  } catch (error) {
    console.error("User takes error:", error);
    return NextResponse.json(
      { message: "Failed to load takes" },
      { status: 500 }
    );
  }
}
