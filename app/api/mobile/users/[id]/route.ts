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

    const userSelect = {
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
    };

    // Try direct ID lookup first (works for both CUID and UUID)
    let user = await prisma.user.findUnique({ where: { id }, select: userSelect });

    // Fallback: try username lookup
    if (!user) {
      user = await prisma.user.findFirst({
        where: { name: { equals: id, mode: "insensitive" }, status: "ACTIVE" },
        select: userSelect,
      });
    }

    // Fallback: try handle lookup
    if (!user) {
      user = await prisma.user.findFirst({
        where: { handle: { equals: id, mode: "insensitive" }, status: "ACTIVE" },
        select: userSelect,
      });
    }

    const userId = user?.id;

    const [isFollowing, isBlocked] = await Promise.all([
      viewer && userId && viewer.id !== userId
        ? prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: viewer.id,
                followingId: userId,
              },
            },
            select: { id: true },
          })
        : Promise.resolve(null),
      viewer && userId && viewer.id !== userId
        ? prisma.userBlock.findUnique({
            where: {
              blockerId_blockedId: {
                blockerId: viewer.id,
                blockedId: userId,
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
      isBlocked: !!isBlocked,
      isSelf: viewer?.id === userId,
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    return NextResponse.json({ message: "Failed to load profile" }, { status: 500 });
  }
}
