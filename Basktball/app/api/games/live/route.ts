import { NextResponse } from "next/server";
import { basketballApi } from "@/lib/api";

export const dynamic = "force-dynamic";
export const revalidate = 0; // No caching for live data

export async function GET() {
  try {
    const liveGames = await basketballApi.getLiveGames();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      count: liveGames.length,
      games: liveGames,
    });
  } catch (error) {
    console.error("Live games API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch live games",
      },
      { status: 500 }
    );
  }
}
