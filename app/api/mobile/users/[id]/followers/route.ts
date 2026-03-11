import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = 50;

    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: { id: true, name: true, image: true },
        },
      },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
    });

    let nextCursor: string | null = null;
    if (followers.length > limit) {
      const lastItem = followers.pop();
      nextCursor = lastItem!.id;
    }

    return NextResponse.json({
      followers: followers.map((f) => f.follower),
      nextCursor,
    });
  } catch (error: unknown) {
    console.error("Get followers error:", error);
    return NextResponse.json(
      { message: "Failed to get followers" },
      { status: 500 }
    );
  }
}
