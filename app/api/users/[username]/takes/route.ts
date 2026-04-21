import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);
    const type = searchParams.get("type") || "takes"; // takes | replies

    const session = await auth();
    const viewerId = (session?.user as { id?: string })?.id;

    const user = await prisma.user.findFirst({
      where: { name: { equals: username, mode: "insensitive" } },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const takes = await prisma.take.findMany({
      where: {
        authorId: user.id,
        isDeleted: false,
        parentId: type === "replies" ? { not: null } : null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
            image: true,
            role: true,
            streakType: true,
            streakCount: true,
          },
        },
        poll: {
          include: {
            options: { orderBy: { position: "asc" } },
            votes: viewerId ? { where: { userId: viewerId }, select: { optionId: true } } : false,
          },
        },
        prediction: { select: { status: true, claim: true, result: true } },
        statCheck: { select: { overallStatus: true, claims: true } },
        agingTake: {
          select: { revisitDate: true, status: true, resurfacedAt: true },
        },
        reactions: viewerId ? { where: { userId: viewerId }, select: { type: true } } : false,
        bookmarks: viewerId ? { where: { userId: viewerId }, select: { id: true } } : false,
        reposts: viewerId ? { where: { userId: viewerId }, select: { id: true } } : false,
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedTakes = takes.map((t: any) => ({
      id: t.id,
      content: t.content,
      author: t.author,
      createdAt: t.createdAt.toISOString(),
      fireCount: t.fireCount,
      brickCount: t.brickCount,
      replyCount: t.replyCount,
      repostCount: t.repostCount,
      viewCount: t.viewCount,
      tags: t.tags,
      gameId: t.gameId,
      parentId: t.parentId,
      quarter: t.quarter,
      gameClock: t.gameClock,
      mediaUrl: t.mediaUrl,
      mediaUrls: t.mediaUrls,
      linkPreview: t.linkPreview,
      userReaction: (Array.isArray(t.reactions) && t.reactions[0]?.type) || null,
      userBookmarked: Array.isArray(t.bookmarks) && t.bookmarks.length > 0,
      userReposted: Array.isArray(t.reposts) && t.reposts.length > 0,
      poll: t.poll ? {
        id: t.poll.id,
        totalVotes: t.poll.totalVotes,
        endsAt: t.poll.endsAt?.toISOString() || null,
        options: t.poll.options,
        votes: Array.isArray(t.poll.votes) ? t.poll.votes : [],
      } : null,
      prediction: t.prediction || null,
      statCheck: t.statCheck || null,
      agingTake: t.agingTake || null,
    }));

    return NextResponse.json({ takes: formattedTakes, nextCursor });
  } catch (error) {
    console.error("Get user takes error:", error);
    return NextResponse.json({ message: "Failed to load takes" }, { status: 500 });
  }
}
