import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const logs = await prisma.gameNotificationLog.findMany({
      orderBy: { sentAt: "desc" },
      take: 50,
      include: {
        game: {
          select: {
            homeTeamId: true,
            awayTeamId: true,
            status: true,
            homeScore: true,
            awayScore: true,
            homeTeam: { select: { name: true, abbreviation: true } },
            awayTeam: { select: { name: true, abbreviation: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, logs });
  } catch (error) {
    console.error("Game notification logs error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch game notification logs" },
      { status: 500 }
    );
  }
}
