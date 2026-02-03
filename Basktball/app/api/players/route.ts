import { NextRequest, NextResponse } from "next/server";
import { basketballApi } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") || searchParams.get("search");
  const playerId = searchParams.get("id");

  try {
    // Get single player by ID
    if (playerId) {
      const player = await basketballApi.getPlayer(playerId);

      if (!player) {
        return NextResponse.json(
          {
            success: false,
            error: "Player not found",
          },
          { status: 404 }
        );
      }

      // Also get season averages
      const seasonAverages = await basketballApi.getPlayerSeasonAverages(playerId);

      return NextResponse.json({
        success: true,
        player,
        seasonAverages,
      });
    }

    // Search players by name
    if (query) {
      const players = await basketballApi.searchPlayers(query);

      return NextResponse.json({
        success: true,
        query,
        count: players.length,
        players,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Please provide a search query (q) or player ID (id)",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Players API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch player data",
      },
      { status: 500 }
    );
  }
}
