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

    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: { id: true, name: true, image: true },
        },
      },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
    });

    let nextCursor: string | null = null;
    if (following.length > limit) {
      const lastItem = following.pop();
      nextCursor = lastItem!.id;
    }

    return NextResponse.json({
      following: following.map((f) => f.following),
      nextCursor,
    });
  } catch (error: unknown) {
    console.error("Get following error:", error);
    return NextResponse.json(
      { message: "Failed to get following" },
      { status: 500 }
    );
  }
}
