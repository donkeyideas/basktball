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

    const stats = await basketballApi.getTeamStats(id, league, season);

    if (!stats) {
      return NextResponse.json({
        success: true,
        teamId: id,
        league,
        stats: null,
        message: "No stats available for this team",
      });
    }

    return NextResponse.json({
      success: true,
      teamId: id,
      league,
      stats,
    });
  } catch (error) {
    console.error("Team stats API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch team stats" },
      { status: 500 }
    );
  }
}
