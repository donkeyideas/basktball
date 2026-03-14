import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);

    const agingTakes = await prisma.agingTake.findMany({
      where: {
        status: "AGED",
        resurfacedAt: { not: null },
      },
      include: {
        take: {
          select: {
            id: true,
            content: true,
            fireCount: true,
            brickCount: true,
            repostCount: true,
            replyCount: true,
            viewCount: true,
            tags: true,
            gameId: true,
            createdAt: true,
            isDeleted: true,
            author: {
              select: {
                id: true,
                displayName: true,
                name: true,
                avatarUrl: true,
                image: true,
                role: true,
                streakType: true,
                streakCount: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            displayName: true,
            name: true,
            avatarUrl: true,
            image: true,
          },
        },
      },
      orderBy: { resurfacedAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    // Filter out aged takes whose underlying take was deleted
    const filtered = agingTakes.filter((at) => !at.take.isDeleted);

    let nextCursor: string | null = null;
    if (filtered.length > limit) {
      filtered.splice(limit);
      nextCursor = filtered[filtered.length - 1].id;
    }

    const results = filtered.map((at) => ({
      id: at.id,
      takeId: at.takeId,
      revisitDate: at.revisitDate,
      reason: at.reason,
      status: at.status,
      resurfacedAt: at.resurfacedAt,
      createdAt: at.createdAt,
      take: at.take,
      agedBy: at.user,
    }));

    return NextResponse.json({ agedTakes: results, nextCursor });
  } catch (error) {
    console.error("Aged takes error:", error);
    return NextResponse.json(
      { message: "Failed to load aged takes" },
      { status: 500 }
    );
  }
}
