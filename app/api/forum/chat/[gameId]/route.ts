import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;

    // Find or create chat room for this game
    let chatRoom = await prisma.chatRoom.findUnique({
      where: { gameId },
      select: {
        id: true,
        gameId: true,
        name: true,
        isActive: true,
        messageCount: true,
        createdAt: true,
      },
    });

    if (!chatRoom) {
      // Get game info to create room name
      const game = await prisma.game.findUnique({
        where: { id: gameId },
        select: {
          id: true,
          homeTeam: { select: { abbreviation: true } },
          awayTeam: { select: { abbreviation: true } },
          status: true,
        },
      });

      if (!game) {
        return NextResponse.json({ error: "Game not found" }, { status: 404 });
      }

      chatRoom = await prisma.chatRoom.create({
        data: {
          gameId,
          name: `${game.awayTeam.abbreviation} @ ${game.homeTeam.abbreviation}`,
          isActive: game.status === "LIVE" || game.status === "SCHEDULED",
        },
        select: {
          id: true,
          gameId: true,
          name: true,
          isActive: true,
          messageCount: true,
          createdAt: true,
        },
      });
    }

    return NextResponse.json({ chatRoom });
  } catch (error) {
    console.error("Error fetching chat room:", error);
    return NextResponse.json({ error: "Failed to fetch chat room" }, { status: 500 });
  }
}
