import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/forum/utils";

export async function POST(
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
    const { type } = await request.json();

    if (!["LIKE", "DISLIKE", "FIRE", "BRICK"].includes(type)) {
      return NextResponse.json({ error: "Invalid reaction type" }, { status: 400 });
    }

    // Check if post exists
    const post = await prisma.forumPost.findUnique({
      where: { id: postId, isDeleted: false },
    });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if user already has this reaction
    const existing = await prisma.postReaction.findUnique({
      where: {
        postId_userId_type: { postId, userId: user.id, type },
      },
    });

    if (existing) {
      // Remove the reaction (toggle off)
      await prisma.$transaction([
        prisma.postReaction.delete({ where: { id: existing.id } }),
        prisma.forumPost.update({
          where: { id: postId },
          data: {
            likeCount: type === "LIKE" || type === "FIRE" ? { decrement: 1 } : undefined,
            dislikeCount: type === "DISLIKE" || type === "BRICK" ? { decrement: 1 } : undefined,
          },
        }),
      ]);

      return NextResponse.json({ action: "removed", type });
    } else {
      // Add the reaction
      await prisma.$transaction([
        prisma.postReaction.create({
          data: { postId, userId: user.id, type },
        }),
        prisma.forumPost.update({
          where: { id: postId },
          data: {
            likeCount: type === "LIKE" || type === "FIRE" ? { increment: 1 } : undefined,
            dislikeCount: type === "DISLIKE" || type === "BRICK" ? { increment: 1 } : undefined,
          },
        }),
      ]);

      // Update author reputation
      if (type === "LIKE" || type === "FIRE") {
        prisma.user.update({
          where: { id: post.authorId },
          data: { reputation: { increment: type === "FIRE" ? 2 : 1 } },
        }).catch(() => {});
      }

      return NextResponse.json({ action: "added", type });
    }
  } catch (error) {
    console.error("Error toggling reaction:", error);
    return NextResponse.json({ error: "Failed to update reaction" }, { status: 500 });
  }
}
