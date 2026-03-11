import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = 25;
    const skip = (page - 1) * limit;

    const thread = await prisma.forumThread.findUnique({
      where: { slug, isDeleted: false },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        isPinned: true,
        isHot: true,
        tags: true,
        postCount: true,
        viewCount: true,
        createdAt: true,
        author: {
          select: { id: true, displayName: true, name: true, avatarUrl: true, image: true, role: true, reputation: true, postCount: true, favoriteTeamId: true, createdAt: true },
        },
        category: {
          select: { id: true, name: true, slug: true, color: true },
        },
      },
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Increment view count
    prisma.forumThread.update({
      where: { id: thread.id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {});

    const [posts, totalPosts] = await Promise.all([
      prisma.forumPost.findMany({
        where: { threadId: thread.id, isDeleted: false },
        orderBy: { postNumber: "asc" },
        skip,
        take: limit,
        select: {
          id: true,
          content: true,
          postNumber: true,
          isEdited: true,
          editedAt: true,
          likeCount: true,
          dislikeCount: true,
          replyToId: true,
          createdAt: true,
          author: {
            select: { id: true, displayName: true, name: true, avatarUrl: true, image: true, role: true, reputation: true, postCount: true, favoriteTeamId: true, createdAt: true },
          },
          reactions: {
            select: { id: true, userId: true, type: true },
          },
        },
      }),
      prisma.forumPost.count({ where: { threadId: thread.id, isDeleted: false } }),
    ]);

    return NextResponse.json({
      thread,
      posts,
      pagination: {
        page,
        limit,
        total: totalPosts,
        totalPages: Math.ceil(totalPosts / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching thread by slug:", error);
    return NextResponse.json({ error: "Failed to fetch thread" }, { status: 500 });
  }
}
