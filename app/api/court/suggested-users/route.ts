import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    const currentUserId = (session?.user as { id?: string })?.id;

    // Get active users with the most takes, excluding current user and users already followed
    const followedIds = currentUserId
      ? (
          await prisma.follow.findMany({
            where: { followerId: currentUserId },
            select: { followingId: true },
          })
        ).map((f) => f.followingId)
      : [];

    const excludeIds = currentUserId ? [currentUserId, ...followedIds] : [];

    const users = await prisma.user.findMany({
      where: {
        ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
        takeCount: { gt: 0 },
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        image: true,
        avatarUrl: true,
        role: true,
        takeCount: true,
        followerCount: true,
      },
      orderBy: [{ followerCount: "desc" }, { takeCount: "desc" }],
      take: 5,
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Suggested users error:", error);
    return NextResponse.json({ users: [] });
  }
}
