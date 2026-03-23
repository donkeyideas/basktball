import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { getCourtUser } from "@/lib/court/auth";
import { getMobileUser } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    let user = getCourtUser(session);

    // Fall back to mobile JWT auth if no session
    if (!user) {
      const mobileUser = await getMobileUser(request);
      if (mobileUser) {
        user = { id: mobileUser.id, role: mobileUser.role };
      }
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "foryou";
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);

    const where: Record<string, unknown> = {
      isDeleted: false,
      parentId: null,
    };

    // Filter out blocked users' content (both directions)
    if (user) {
      const blocks = await prisma.userBlock.findMany({
        where: {
          OR: [
            { blockerId: user.id },
            { blockedId: user.id },
          ],
        },
        select: { blockerId: true, blockedId: true },
      });
      const blockedIds = [
        ...new Set(
          blocks.map((b) => (b.blockerId === user!.id ? b.blockedId : b.blockerId))
        ),
      ];
      if (blockedIds.length > 0) {
        where.authorId = { notIn: blockedIds };
      }
    }

    if (type === "following" && user) {
      const following = await prisma.follow.findMany({
        where: { followerId: user.id },
        select: { followingId: true },
      });
      const followIds = following.map((f) => f.followingId);
      followIds.push(user.id);
      // Merge with existing authorId filter (blocked users)
      const existingNotIn = (where.authorId as any)?.notIn || [];
      where.authorId = {
        in: followIds.filter((id) => !existingNotIn.includes(id)),
      };
    } else if (type === "live") {
      where.gameId = { not: null };
    }

    const takes = await prisma.take.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            displayName: true,
            image: true,
            avatarUrl: true,
            role: true,
            streakType: true,
            streakCount: true,
          },
        },
        poll: {
          include: {
            options: { orderBy: { position: "asc" } },
            ...(user
              ? {
                  votes: {
                    where: { userId: user.id },
                    select: { optionId: true },
                  },
                }
              : {}),
          },
        },
        prediction: {
          select: { status: true, claim: true, result: true },
        },
        statCheck: {
          select: { overallStatus: true, claims: true },
        },
        agingTake: {
          select: { revisitDate: true, status: true, resurfacedAt: true },
        },
        ...(user
          ? {
              reactions: {
                where: { userId: user.id },
                select: { type: true },
              },
              bookmarks: {
                where: { userId: user.id },
                select: { id: true },
              },
              reposts: {
                where: { userId: user.id },
                select: { id: true },
              },
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    let nextCursor: string | null = null;
    if (takes.length > limit) {
      takes.pop();
      nextCursor = takes[takes.length - 1].id;
    }

    const formatted = takes.map((take) => ({
      ...take,
      userReaction:
        "reactions" in take && Array.isArray(take.reactions) && take.reactions.length > 0
          ? (take.reactions[0] as { type: string }).type
          : null,
      userBookmarked:
        "bookmarks" in take && Array.isArray(take.bookmarks) && take.bookmarks.length > 0,
      userReposted:
        "reposts" in take && Array.isArray(take.reposts) && take.reposts.length > 0,
      reactions: undefined,
      bookmarks: undefined,
      reposts: undefined,
    }));

    return NextResponse.json({ takes: formatted, nextCursor });
  } catch (error) {
    console.error("Court feed error:", error);
    return NextResponse.json({ message: "Failed to load feed" }, { status: 500 });
  }
}
