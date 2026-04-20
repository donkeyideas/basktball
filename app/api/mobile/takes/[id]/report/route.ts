import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireMobileUser, AuthError } from "@/lib/mobile-auth";

const VALID_REASONS = ["SPAM", "HARASSMENT", "OFFENSIVE", "OFF_TOPIC", "MISINFORMATION", "OTHER"] as const;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireMobileUser(request);
    const { id: takeId } = await params;
    const { reason, details } = await request.json();

    if (!reason || !VALID_REASONS.includes(reason)) {
      return NextResponse.json(
        { message: "Invalid report reason" },
        { status: 400 }
      );
    }

    // Check take exists
    const take = await prisma.take.findUnique({
      where: { id: takeId },
      select: { id: true, authorId: true },
    });
    if (!take) {
      return NextResponse.json(
        { message: "Take not found" },
        { status: 404 }
      );
    }

    if (take.authorId === user.id) {
      return NextResponse.json(
        { message: "You cannot report your own take" },
        { status: 400 }
      );
    }

    // Check if already reported by this user
    const existing = await prisma.takeReport.findUnique({
      where: {
        takeId_reporterId: {
          takeId,
          reporterId: user.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "You have already reported this take" },
        { status: 409 }
      );
    }

    await prisma.takeReport.create({
      data: {
        takeId,
        reporterId: user.id,
        reason,
        details: details?.slice(0, 500) || null,
      },
    });

    return NextResponse.json({ reported: true });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    console.error("Report take error:", error);
    return NextResponse.json(
      { message: "Failed to report take" },
      { status: 500 }
    );
  }
}
