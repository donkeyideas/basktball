import { NextRequest, NextResponse } from "next/server";
import { basketballApi, League } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const league = (searchParams.get("league") || "nba") as League;
    const season = searchParams.get("season")
      ? parseInt(searchParams.get("season")!)
      : undefined;

    const games = await basketballApi.getTeamGames(id, league, { season });

    return NextResponse.json({
      success: true,
      teamId: id,
      league,
      count: games.length,
      games,
    });
  } catch (error) {
    console.error("Team games API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch team games" },
      { status: 500 }
    );
  }
}
