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
    const status = searchParams.get("status"); // AGING | AGED | EXPIRED

    const user = await prisma.user.findFirst({
      where: { name: { equals: username, mode: "insensitive" } },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const agingTakes = await prisma.agingTake.findMany({
      where: {
        userId: user.id,
        ...(status ? { status } : {}),
      },
      include: {
        take: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            fireCount: true,
            brickCount: true,
            replyCount: true,
            author: {
              select: { id: true, name: true, displayName: true, avatarUrl: true, image: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    let nextCursor: string | null = null;
    if (agingTakes.length > limit) {
      agingTakes.pop();
      nextCursor = agingTakes[agingTakes.length - 1].id;
    }

    return NextResponse.json({ agingTakes, nextCursor });
  } catch (error) {
    console.error("Get user aging takes error:", error);
    return NextResponse.json({ message: "Failed to load aging takes" }, { status: 500 });
  }
}
