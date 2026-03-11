import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getMobileUser } from "@/lib/mobile-auth";

// GET /api/mobile/users/[id] - Get a user's public profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const viewer = await getMobileUser(request);

    const [user, isFollowing] = await Promise.all([
      prisma.user.findUnique({
        where: { id },
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
          createdAt: true,
        },
      }),
      viewer && viewer.id !== id
        ? prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: viewer.id,
                followingId: id,
              },
            },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user,
      isFollowing: !!isFollowing,
      isSelf: viewer?.id === id,
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    return NextResponse.json({ message: "Failed to load profile" }, { status: 500 });
  }
}
