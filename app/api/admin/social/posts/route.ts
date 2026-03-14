import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import type { SocialPlatform, SocialPostStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/admin/social/posts — list with filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const platform = searchParams.get("platform") as SocialPlatform | null;
    const status = searchParams.get("status") as SocialPostStatus | null;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (platform) where.platform = platform;
    if (status) where.status = status;

    const [posts, total] = await Promise.all([
      prisma.socialMediaPost.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.socialMediaPost.count({ where }),
    ]);

    return NextResponse.json({ success: true, posts, total, page, limit });
  } catch (error) {
    console.error("Error fetching social posts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

// POST /api/admin/social/posts — create a post
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { platform, content, imagePrompt, hashtags, status, tone, topic, scheduledAt } = body;

    if (!platform || !content) {
      return NextResponse.json(
        { success: false, error: "Platform and content are required" },
        { status: 400 }
      );
    }

    const post = await prisma.socialMediaPost.create({
      data: {
        platform,
        content,
        imagePrompt: imagePrompt || null,
        hashtags: hashtags || [],
        status: status || "DRAFT",
        tone: tone || null,
        topic: topic || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      },
    });

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error("Error creating social post:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create post" },
      { status: 500 }
    );
  }
}
