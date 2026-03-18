import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);

    const user = await prisma.user.findFirst({
      where: { name: { equals: username, mode: "insensitive" } },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const challenges = await prisma.challenge.findMany({
      where: {
        OR: [
          { challengerId: user.id },
          { challengedId: user.id },
        ],
      },
      include: {
        challenger: {
          select: { id: true, displayName: true, name: true, avatarUrl: true, image: true, challengeWins: true, challengeLosses: true },
        },
        challenged: {
          select: { id: true, displayName: true, name: true, avatarUrl: true, image: true, challengeWins: true, challengeLosses: true },
        },
        challengerTake: { select: { id: true, content: true, createdAt: true } },
        challengedTake: { select: { id: true, content: true, createdAt: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    let nextCursor: string | null = null;
    if (challenges.length > limit) {
      challenges.pop();
      nextCursor = challenges[challenges.length - 1].id;
    }

    return NextResponse.json({ challenges, nextCursor });
  } catch (error) {
    console.error("Get user challenges error:", error);
    return NextResponse.json({ message: "Failed to load challenges" }, { status: 500 });
  }
}
