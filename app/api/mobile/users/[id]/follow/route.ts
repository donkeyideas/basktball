import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireMobileUser, AuthError } from "@/lib/mobile-auth";
import { createNotification } from "@/lib/notifications/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireMobileUser(request);
    const { id: targetUserId } = await params;

    if (user.id === targetUserId) {
      return NextResponse.json(
        { message: "Cannot follow yourself" },
        { status: 400 }
      );
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

      createNotification({
        userId: targetUserId,
        type: "FOLLOW",
        title: "You have a new follower!",
        data: { followerId: user.id },
        actorId: user.id,
      }).catch(() => {});

      return NextResponse.json({ action: "followed" });
    }
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    console.error("Follow error:", error);
    return NextResponse.json(
      { message: "Failed to toggle follow" },
      { status: 500 }
    );
  }
}
