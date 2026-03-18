import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const session = await auth();
    const viewerId = (session?.user as { id?: string })?.id;

    const user = await prisma.user.findFirst({
      where: {
        name: { equals: username, mode: "insensitive" },
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        image: true,
        location: true,
        role: true,
        takeCount: true,
        followerCount: true,
        followingCount: true,
        challengeWins: true,
        challengeLosses: true,
        predictionCount: true,
        correctPredictions: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check follow status
    let isFollowing = false;
    if (viewerId && viewerId !== user.id) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: viewerId,
            followingId: user.id,
          },
        },
        select: { id: true },
      });
      isFollowing = !!follow;
    }

    return NextResponse.json({
      user,
      isFollowing,
      isSelf: viewerId === user.id,
    });
  } catch (error) {
    console.error("Get public profile error:", error);
    return NextResponse.json({ message: "Failed to load profile" }, { status: 500 });
  }
}
