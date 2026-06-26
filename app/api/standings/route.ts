import { NextRequest, NextResponse } from "next/server";
import { getStandings } from "@/lib/standings/standings";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const league = request.nextUrl.searchParams.get("league") || "nba";

  try {
    const conferences = await getStandings(league);

    if (!conferences) {
      return NextResponse.json(
        { success: false, error: "Standings not available" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, league, conferences });
  } catch (error) {
    console.error("Standings API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch standings" },
      { status: 500 }
    );
  }
}
