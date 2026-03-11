import { NextRequest, NextResponse } from "next/server";
import { basketballApi, League } from "@/lib/api";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // Revalidate every hour

const VALID_LEAGUES = ["nba", "wnba", "ncaam", "ncaaw", "euro", "intl"];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const teamId = searchParams.get("id");
  const league = searchParams.get("league");
  const grouped = searchParams.get("grouped") === "true";

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

    // Return teams grouped by league
    if (grouped) {
      const teamsGrouped = await basketballApi.getTeamsGrouped();
      const totalCount = Object.values(teamsGrouped).reduce(
        (sum, teams) => sum + teams.length,
        0
      );

      return NextResponse.json({
        success: true,
        count: totalCount,
        teams: teamsGrouped,
      });
    }

    // Filter by specific league
    if (league) {
      if (!VALID_LEAGUES.includes(league)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid league. Must be one of: ${VALID_LEAGUES.join(", ")}`,
          },
          { status: 400 }
        );
      }

      const teams = await basketballApi.getTeamsByLeague(league as League);

      return NextResponse.json({
        success: true,
        league,
        count: teams.length,
        teams,
      });
    }

    // Get all teams from all leagues
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
