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
    const status = searchParams.get("status"); // PENDING | RECEIPT | BUST

    const user = await prisma.user.findFirst({
      where: { name: { equals: username, mode: "insensitive" } },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const validStatuses = ["PENDING", "RECEIPT", "BUST", "UNRESOLVABLE"];
    const statusFilter = status && validStatuses.includes(status) ? status as "PENDING" | "RECEIPT" | "BUST" | "UNRESOLVABLE" : undefined;

    const predictions = await prisma.prediction.findMany({
      where: {
        userId: user.id,
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      include: {
        take: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: {
              select: { id: true, name: true, displayName: true, avatarUrl: true, image: true },
            },
          },
        },
        game: {
          select: {
            id: true,
            homeTeam: { select: { name: true, abbreviation: true } },
            awayTeam: { select: { name: true, abbreviation: true } },
            homeScore: true,
            awayScore: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    let nextCursor: string | null = null;
    if (predictions.length > limit) {
      predictions.pop();
      nextCursor = predictions[predictions.length - 1].id;
    }

    return NextResponse.json({ predictions, nextCursor });
  } catch (error) {
    console.error("Get user predictions error:", error);
    return NextResponse.json({ message: "Failed to load predictions" }, { status: 500 });
  }
}
