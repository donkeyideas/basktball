import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getMobileUser } from "@/lib/mobile-auth";

// GET /api/mobile/feed?type=foryou|following|live&cursor=&limit=
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "foryou";
    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    const user = await getMobileUser(request);

    const takeSelect = {
      id: true,
      content: true,
      gameId: true,
      parentId: true,
      tags: true,
      mediaUrl: true,
      mediaUrls: true,
      linkPreview: true,
      fireCount: true,
      brickCount: true,
      repostCount: true,
      replyCount: true,
      viewCount: true,
      createdAt: true,
      author: {
        select: {
          id: true,
          displayName: true,
          name: true,
          avatarUrl: true,
          image: true,
          role: true,
        },
      },
    };

    let where: Record<string, unknown> = {
      isDeleted: false,
      parentId: null, // Only top-level takes in feed
    };

    if (type === "following" && user) {
      const following = await prisma.follow.findMany({
        where: { followerId: user.id },
        select: { followingId: true },
      });
      const followingIds = following.map((f) => f.followingId);
      followingIds.push(user.id); // Include own takes
      where.authorId = { in: followingIds };
    } else if (type === "live") {
      // Get active game IDs
      const liveGames = await prisma.game.findMany({
        where: { status: "LIVE" },
        select: { id: true },
      });
      const gameIds = liveGames.map((g) => g.id);
      where.gameId = { in: gameIds };
    }

    const takes = await prisma.take.findMany({
      where,
      select: takeSelect,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = takes.length > limit;
    const items = hasMore ? takes.slice(0, limit) : takes;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return NextResponse.json({
      takes: items,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("Feed error:", error);
    return NextResponse.json({ message: "Failed to load feed" }, { status: 500 });
  }
}
