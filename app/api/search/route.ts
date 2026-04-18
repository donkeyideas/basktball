import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// GET /api/search?q=lebron&type=all|takes|users|players
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const type = searchParams.get("type") || "all";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    if (!q || q.length < 1) {
      return NextResponse.json({ takes: [], users: [], players: [] });
    }

    const results: { takes?: unknown[]; users?: unknown[]; players?: unknown[] } = {};

    if (type === "all" || type === "takes") {
      results.takes = await prisma.take.findMany({
        where: {
          isDeleted: false,
          content: { contains: q, mode: "insensitive" },
        },
        select: {
          id: true,
          content: true,
          mediaUrl: true,
          linkPreview: true,
          fireCount: true,
          brickCount: true,
          replyCount: true,
          repostCount: true,
          createdAt: true,
          tags: true,
          author: {
            select: {
              id: true,
              displayName: true,
              name: true,
              handle: true,
              avatarUrl: true,
              image: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
    }

    if (type === "all" || type === "users") {
      results.users = await prisma.user.findMany({
        where: {
          status: "ACTIVE",
          OR: [
            { handle: { contains: q, mode: "insensitive" } },
            { displayName: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          handle: true,
          displayName: true,
          name: true,
          avatarUrl: true,
          image: true,
          bio: true,
          followerCount: true,
          takeCount: true,
        },
        orderBy: { followerCount: "desc" },
        take: limit,
      });
    }

    if (type === "all" || type === "players") {
      results.players = await prisma.player.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          position: true,
          teamId: true,
          headshotUrl: true,
          team: {
            select: { name: true, abbreviation: true },
          },
        },
        take: limit,
      });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ message: "Search failed" }, { status: 500 });
  }
}
