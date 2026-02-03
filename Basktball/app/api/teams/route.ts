import { NextRequest, NextResponse } from "next/server";
import { basketballApi } from "@/lib/api";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // Revalidate every hour

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const teamId = searchParams.get("id");

  try {
    // Get single team by ID
    if (teamId) {
      const team = await basketballApi.getTeam(teamId);

      if (!team) {
        return NextResponse.json(
          {
            success: false,
            error: "Team not found",
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        team,
      });
    }

    // Get all teams
    const teams = await basketballApi.getTeams();

    return NextResponse.json({
      success: true,
      count: teams.length,
      teams,
    });
  } catch (error) {
    console.error("Teams API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch team data",
      },
      { status: 500 }
    );
  }
}
