import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET - Fetch player details by ESPN ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const league = request.nextUrl.searchParams.get("league") || "nba";

    const sportSlugs: Record<string, string> = {
      nba: "basketball/nba",
      wnba: "basketball/wnba",
      ncaam: "basketball/mens-college-basketball",
      ncaaw: "basketball/womens-college-basketball",
    };
    const sportSlug = sportSlugs[league] || "basketball/nba";

    // Fetch player info and stats overview from ESPN in parallel
    const [athleteRes, overviewRes] = await Promise.all([
      fetch(
        `https://site.api.espn.com/apis/common/v3/sports/${sportSlug}/athletes/${id}`,
        { headers: { Accept: "application/json" } }
      ),
      fetch(
        `https://site.web.api.espn.com/apis/common/v3/sports/${sportSlug}/athletes/${id}/overview`,
        { headers: { Accept: "application/json" } }
      ),
    ]);

    if (!athleteRes.ok) {
      return NextResponse.json(
        { success: false, error: "Player not found" },
        { status: 404 }
      );
    }

    const espnData = await athleteRes.json();
    const athlete = espnData.athlete;

    if (!athlete) {
      return NextResponse.json(
        { success: false, error: "Player not found" },
        { status: 404 }
      );
    }

    // Parse stats from overview endpoint
    const stats = {
      ppg: 0,
      rpg: 0,
      apg: 0,
      spg: 0,
      bpg: 0,
      fgPct: 0,
      threePct: 0,
      ftPct: 0,
      mpg: 0,
      tov: 0,
      gamesPlayed: 0,
    };

    if (overviewRes.ok) {
      try {
        const overviewData = await overviewRes.json();
        const labels: string[] = overviewData.statistics?.labels || [];
        const regularSeason = overviewData.statistics?.splits?.find(
          (s: { displayName: string }) => s.displayName === "Regular Season"
        );
        const statValues: string[] = regularSeason?.stats || [];

        labels.forEach((label, index) => {
          const value = parseFloat(statValues[index]) || 0;
          switch (label) {
            case "PTS": stats.ppg = value; break;
            case "REB": stats.rpg = value; break;
            case "AST": stats.apg = value; break;
            case "STL": stats.spg = value; break;
            case "BLK": stats.bpg = value; break;
            case "FG%": stats.fgPct = value; break;
            case "3P%": stats.threePct = value; break;
            case "FT%": stats.ftPct = value; break;
            case "MIN": stats.mpg = value; break;
            case "TO": stats.tov = value; break;
            case "GP": stats.gamesPlayed = value; break;
          }
        });
      } catch {
        console.error("Failed to parse ESPN overview stats");
      }
    }

    // Parse weight number from display string like "230 lbs"
    const weightNum = athlete.displayWeight
      ? parseInt(athlete.displayWeight.replace(/[^\d]/g, ""))
      : undefined;

    return NextResponse.json({
      success: true,
      player: {
        id,
        name: athlete.displayName,
        team: athlete.team?.displayName || "Free Agent",
        teamAbbr: athlete.team?.abbreviation || "FA",
        position: athlete.position?.abbreviation,
        height: athlete.displayHeight,
        weight: weightNum,
        headshotUrl:
          athlete.headshot?.href ||
          `https://a.espncdn.com/i/headshots/nba/players/full/${id}.png`,
      },
      stats,
      source: "espn",
    });
  } catch (error) {
    console.error("Error fetching player:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch player" },
      { status: 500 }
    );
  }
}
