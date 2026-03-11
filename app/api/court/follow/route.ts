import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { getCourtUser } from "@/lib/court/auth";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const user = getCourtUser(session);
    if (!user) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const { targetUserId } = await request.json();
    if (!targetUserId) {
      return NextResponse.json({ message: "targetUserId required" }, { status: 400 });
    }

    if (user.id === targetUserId) {
      return NextResponse.json({ message: "Cannot follow yourself" }, { status: 400 });
    }

    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId: targetUserId,
        },
      },
    });

    if (existing) {
      await prisma.$transaction([
        prisma.follow.delete({ where: { id: existing.id } }),
        prisma.user.update({
          where: { id: user.id },
          data: { followingCount: { decrement: 1 } },
        }),
        prisma.user.update({
          where: { id: targetUserId },
          data: { followerCount: { decrement: 1 } },
        }),
      ]);
      return NextResponse.json({ action: "unfollowed" });
    } else {
      await prisma.$transaction([
        prisma.follow.create({
          data: { followerId: user.id, followingId: targetUserId },
        }),
        prisma.user.update({
          where: { id: user.id },
          data: { followingCount: { increment: 1 } },
        }),
        prisma.user.update({
          where: { id: targetUserId },
          data: { followerCount: { increment: 1 } },
        }),
      ]);
      return NextResponse.json({ action: "followed" });
    }
  } catch (error) {
    console.error("Follow error:", error);
    return NextResponse.json({ message: "Failed to toggle follow" }, { status: 500 });
  }
}
