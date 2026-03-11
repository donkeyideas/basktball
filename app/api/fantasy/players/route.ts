import { NextRequest, NextResponse } from "next/server";
import { getFantasyProjections } from "@/lib/api/live-stats";

export const dynamic = "force-dynamic";

// GET - Fetch fantasy players with projections from ESPN live data
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");

    const players = await getFantasyProjections(limit);

    return NextResponse.json({
      success: true,
      players,
      salaryCap: 50000,
      source: "espn_live",
    });
  } catch (error) {
    console.error("Error fetching fantasy players:", error);
    return NextResponse.json({
      success: true,
      players: [],
      salaryCap: 50000,
      source: "unavailable",
    });
  }
}
