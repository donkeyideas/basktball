import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireMobileUser } from "@/lib/mobile-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireMobileUser(request);
    const { id: blockedId } = await params;

    if (user.id === blockedId) {
      return NextResponse.json(
        { message: "You cannot block yourself" },
        { status: 400 }
      );
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: blockedId },
      select: { id: true },
    });
    if (!targetUser) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Check if already blocked
    const existing = await prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: user.id,
          blockedId,
        },
      },
    });

    if (existing) {
      // Unblock
      await prisma.userBlock.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ blocked: false });
    }

    // Block the user
    await prisma.userBlock.create({
      data: {
        blockerId: user.id,
        blockedId,
      },
    });

    // Also unfollow each other if following
    await prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: user.id, followingId: blockedId },
          { followerId: blockedId, followingId: user.id },
        ],
      },
    });

    return NextResponse.json({ blocked: true });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("Block user error:", error);
    return NextResponse.json(
      { message: "Failed to block user" },
      { status: 500 }
    );
  }
}
