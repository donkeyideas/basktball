import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/forum/utils";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const user = requireAuth(session);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { postId, reason, details } = await request.json();

    if (!postId || !reason) {
      return NextResponse.json({ error: "Post ID and reason are required" }, { status: 400 });
    }

    const validReasons = ["SPAM", "HARASSMENT", "OFFENSIVE", "OFF_TOPIC", "MISINFORMATION", "OTHER"];
    if (!validReasons.includes(reason)) {
      return NextResponse.json({ error: "Invalid report reason" }, { status: 400 });
    }

    // Check if post exists
    const post = await prisma.forumPost.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check for duplicate report
    const existingReport = await prisma.forumReport.findFirst({
      where: { postId, reporterId: user.id, status: "PENDING" },
    });
    if (existingReport) {
      return NextResponse.json({ error: "You already reported this post" }, { status: 409 });
    }

    const report = await prisma.forumReport.create({
      data: {
        postId,
        reporterId: user.id,
        reason,
        details: details?.trim() || null,
      },
    });

    return NextResponse.json({ report: { id: report.id } }, { status: 201 });
  } catch (error) {
    console.error("Error creating report:", error);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}
