import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const insight = await prisma.aiInsight.findUnique({
      where: { id },
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
    });

    if (!insight) {
      return NextResponse.json(
        { success: false, error: "Insight not found" },
        { status: 404 }
      );
    }

    // Only return published and approved insights
    if (!insight.published || !insight.approved) {
      return NextResponse.json(
        { success: false, error: "Insight not available" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      insight,
    });
  } catch (error) {
    console.error("Insight fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch insight" },
      { status: 500 }
    );
  }
}
