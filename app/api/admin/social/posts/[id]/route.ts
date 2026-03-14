import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// GET /api/admin/social/posts/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const post = await prisma.socialMediaPost.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error("Error fetching social post:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch post" }, { status: 500 });
  }
}

// PUT /api/admin/social/posts/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { content, imagePrompt, hashtags, status, tone, topic, scheduledAt } = body;

    const data: Record<string, unknown> = {};
    if (content !== undefined) data.content = content;
    if (imagePrompt !== undefined) data.imagePrompt = imagePrompt;
    if (hashtags !== undefined) data.hashtags = hashtags;
    if (status !== undefined) data.status = status;
    if (tone !== undefined) data.tone = tone;
    if (topic !== undefined) data.topic = topic;
    if (scheduledAt !== undefined) data.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;

    const post = await prisma.socialMediaPost.update({ where: { id }, data });
    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error("Error updating social post:", error);
    return NextResponse.json({ success: false, error: "Failed to update post" }, { status: 500 });
  }
}

// DELETE /api/admin/social/posts/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.socialMediaPost.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting social post:", error);
    return NextResponse.json({ success: false, error: "Failed to delete post" }, { status: 500 });
  }
}
