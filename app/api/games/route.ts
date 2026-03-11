import { NextRequest, NextResponse } from "next/server";
import { basketballApi, League } from "@/lib/api";

export const dynamic = "force-dynamic";
export const revalidate = 30; // Revalidate every 30 seconds

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const league = (searchParams.get("league") as League) || "nba";
  const date = searchParams.get("date") || undefined;

  try {
    const games = await basketballApi.getGames(league, date);

    return NextResponse.json({
      success: true,
      league,
      date: date || new Date().toISOString().split("T")[0],
      count: games.length,
      games,
    });
  } catch (error) {
    console.error("Games API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch games",
      },
      { status: 500 }
    );
  }
}
