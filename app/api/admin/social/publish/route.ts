import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { publishPost } from "@/lib/social/publisher";

export const dynamic = "force-dynamic";

// POST /api/admin/social/publish — publish a post to its platform
export async function POST(req: NextRequest) {
  try {
    const { postId } = await req.json();

    if (!postId) {
      return NextResponse.json(
        { success: false, error: "postId is required" },
        { status: 400 }
      );
    }

    const post = await prisma.socialMediaPost.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

    if (post.status === "PUBLISHED") {
      return NextResponse.json(
        { success: false, error: "Post is already published" },
        { status: 400 }
      );
    }

    const result = await publishPost(post);

    const updatedPost = await prisma.socialMediaPost.update({
      where: { id: postId },
      data: {
        status: result.success ? "PUBLISHED" : "FAILED",
        publishedAt: result.success ? new Date() : null,
        externalId: result.externalId || null,
        errorMessage: result.error || null,
      },
    });

    return NextResponse.json({
      success: result.success,
      post: updatedPost,
      error: result.error,
    });
  } catch (error) {
    console.error("Error publishing social post:", error);
    return NextResponse.json(
      { success: false, error: "Failed to publish post" },
      { status: 500 }
    );
  }
}
