import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { sanitizeContent, requireAuth } from "@/lib/forum/utils";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const user = requireAuth(session);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { content, threadId, replyToId } = await request.json();

    if (!content?.trim() || !threadId) {
      return NextResponse.json({ error: "Content and thread ID are required" }, { status: 400 });
    }

    // Verify thread exists and is open
    const thread = await prisma.forumThread.findUnique({
      where: { id: threadId, isDeleted: false },
      select: { id: true, status: true, categoryId: true, postCount: true },
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    if (thread.status === "LOCKED" || thread.status === "ARCHIVED") {
      return NextResponse.json({ error: "This thread is locked" }, { status: 403 });
    }

    const sanitizedContent = sanitizeContent(content);
    const now = new Date();

    // Create post + update counters in transaction
    const post = await prisma.$transaction(async (tx) => {
      const newPost = await tx.forumPost.create({
        data: {
          content: sanitizedContent,
          threadId,
          authorId: user.id,
          postNumber: thread.postCount + 1,
          replyToId: replyToId || null,
        },
        select: {
          id: true,
          content: true,
          postNumber: true,
          createdAt: true,
          author: {
            select: { id: true, displayName: true, name: true, avatarUrl: true, image: true, role: true, reputation: true, favoriteTeamId: true },
          },
        },
      });

      await tx.forumThread.update({
        where: { id: threadId },
        data: {
          postCount: { increment: 1 },
          lastPostAt: now,
          lastPostBy: user.id,
        },
      });

      await tx.forumCategory.update({
        where: { id: thread.categoryId },
        data: { postCount: { increment: 1 } },
      });

      await tx.user.update({
        where: { id: user.id },
        data: { postCount: { increment: 1 } },
      });

      return newPost;
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
