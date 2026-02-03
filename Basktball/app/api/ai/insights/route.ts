import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");
  const gameId = searchParams.get("gameId");
  const playerId = searchParams.get("playerId");
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const pending = searchParams.get("pending") === "true";

  try {
    const where: Record<string, unknown> = {
      published: !pending,
      approved: !pending,
    };

    if (type) {
      where.type = type.toUpperCase();
    }

    if (gameId) {
      where.gameId = gameId;
    }

    if (playerId) {
      where.playerId = playerId;
    }

    if (pending) {
      where.approved = false;
      delete where.published;
    }

    const insights = await prisma.aiInsight.findMany({
      where,
      include: {
        player: {
          select: {
            id: true,
            name: true,
            team: {
              select: {
                name: true,
                abbreviation: true,
              },
            },
          },
        },
        game: {
          select: {
            id: true,
            gameDate: true,
            homeTeam: {
              select: {
                name: true,
                abbreviation: true,
              },
            },
            awayTeam: {
              select: {
                name: true,
                abbreviation: true,
              },
            },
            homeScore: true,
            awayScore: true,
          },
        },
      },
      orderBy: {
        generatedAt: "desc",
      },
      take: Math.min(limit, 50),
    });

    return NextResponse.json({
      success: true,
      count: insights.length,
      insights,
    });
  } catch (error) {
    console.error("Insights fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch insights",
      },
      { status: 500 }
    );
  }
}
