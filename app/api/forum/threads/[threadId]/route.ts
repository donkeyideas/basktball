import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/forum/utils";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId } = await params;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = 25;
    const skip = (page - 1) * limit;

    const thread = await prisma.forumThread.findUnique({
      where: { id: threadId, isDeleted: false },
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

    // Increment view count (fire-and-forget)
    prisma.forumThread.update({
      where: { id: threadId },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {});

    const [posts, totalPosts] = await Promise.all([
      prisma.forumPost.findMany({
        where: { threadId, isDeleted: false },
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
      prisma.forumPost.count({ where: { threadId, isDeleted: false } }),
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
    console.error("Error fetching thread:", error);
    return NextResponse.json({ error: "Failed to fetch thread" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const session = await auth();
    const user = requireAuth(session);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { threadId } = await params;
    const thread = await prisma.forumThread.findUnique({ where: { id: threadId } });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const isMod = user.role === "ADMIN" || user.role === "MODERATOR" || user.role === "EDITOR";
    const isAuthor = thread.authorId === user.id;

    if (!isMod && !isAuthor) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};

    // Author can edit title
    if (isAuthor && body.title) {
      data.title = body.title.trim();
    }

    // Mods can lock/pin/archive
    if (isMod) {
      if (body.status) data.status = body.status;
      if (typeof body.isPinned === "boolean") data.isPinned = body.isPinned;
      if (typeof body.isHot === "boolean") data.isHot = body.isHot;
    }

    const updated = await prisma.forumThread.update({
      where: { id: threadId },
      data,
    });

    return NextResponse.json({ thread: updated });
  } catch (error) {
    console.error("Error updating thread:", error);
    return NextResponse.json({ error: "Failed to update thread" }, { status: 500 });
  }
}
