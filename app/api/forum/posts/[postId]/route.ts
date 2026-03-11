import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { sanitizeContent, requireAuth } from "@/lib/forum/utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await auth();
    const user = requireAuth(session);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { postId } = await params;
    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.authorId !== user.id) {
      return NextResponse.json({ error: "You can only edit your own posts" }, { status: 403 });
    }

    const { content } = await request.json();
    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const updated = await prisma.forumPost.update({
      where: { id: postId },
      data: {
        content: sanitizeContent(content),
        isEdited: true,
        editedAt: new Date(),
      },
    });

    return NextResponse.json({ post: updated });
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await auth();
    const user = requireAuth(session);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { postId } = await params;
    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const isMod = user.role === "ADMIN" || user.role === "MODERATOR" || user.role === "EDITOR";
    if (post.authorId !== user.id && !isMod) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await prisma.forumPost.update({
      where: { id: postId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
