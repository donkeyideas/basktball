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

    const roster = await basketballApi.getTeamRoster(id, league);

    return NextResponse.json({
      success: true,
      teamId: id,
      league,
      count: roster.length,
      players: roster,
    });
  } catch (error) {
    console.error("Team roster API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch team roster" },
      { status: 500 }
    );
  }
}
