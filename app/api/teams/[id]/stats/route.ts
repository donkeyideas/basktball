import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface EspnRecordItem {
  description: string;
  summary: string;
  stats: Array<{ name: string; value: number; displayValue: string }>;
}

interface EspnTeamResponse {
  team: {
    id: string;
    displayName: string;
    record?: {
      items: EspnRecordItem[];
    };
    standingSummary?: string;
  };
}

const LEAGUE_SLUGS: Record<string, string> = {
  nba: "basketball/nba",
  wnba: "basketball/wnba",
  ncaam: "basketball/mens-college-basketball",
  ncaaw: "basketball/womens-college-basketball",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const league = request.nextUrl.searchParams.get("league") || "nba";
    const slug = LEAGUE_SLUGS[league] || "basketball/nba";

    // Fetch team info + record from ESPN
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/${slug}/teams/${id}`,
      { headers: { Accept: "application/json" }, next: { revalidate: 900 } }
    );

    if (!res.ok) {
      return NextResponse.json({
        success: true,
        teamId: id,
        stats: null,
        message: "Team not found",
      });
    }

    const data: EspnTeamResponse = await res.json();
    const records = data.team.record?.items || [];

    // Extract overall record
    const overall = records.find((r) => r.description === "Overall Record");
    if (!overall) {
      return NextResponse.json({
        success: true,
        teamId: id,
        stats: null,
        message: "No stats available",
      });
    }

    const getStat = (name: string) =>
      overall.stats.find((s) => s.name === name)?.value ?? 0;

    const wins = getStat("wins");
    const losses = getStat("losses");
    const ppg = getStat("avgPointsFor");
    const oppPpg = getStat("avgPointsAgainst");
    const totalGames = wins + losses;

    // Fetch recent games from schedule
    const schedRes = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/${slug}/teams/${id}/schedule`,
      { headers: { Accept: "application/json" }, next: { revalidate: 900 } }
    );

    let recentGames: Array<{ opponent: string; result: string; score: string }> = [];

    if (schedRes.ok) {
      const schedData = await schedRes.json();
      const events = schedData.events || [];

      // Get last 10 completed games
      const completed = events
        .filter((e: any) => {
          const comp = e.competitions?.[0];
          return comp?.status?.type?.completed === true;
        })
        .slice(-10);

      recentGames = completed.map((e: any) => {
        const comp = e.competitions[0];
        const us = comp.competitors.find(
          (c: any) => String(c.team.id) === String(id)
        );
        const them = comp.competitors.find(
          (c: any) => String(c.team.id) !== String(id)
        );
        const ourScore = parseInt(us?.score?.displayValue || "0");
        const theirScore = parseInt(them?.score?.displayValue || "0");
        const won = ourScore > theirScore;

        return {
          opponent: them?.team?.abbreviation || "???",
          result: won ? "W" : "L",
          score: `${ourScore}-${theirScore}`,
        };
      });
    }

    return NextResponse.json({
      success: true,
      teamId: id,
      league,
      stats: {
        wins,
        losses,
        winPct: totalGames > 0 ? Math.round((wins / totalGames) * 1000) / 10 : 0,
        ppg: Math.round(ppg * 10) / 10,
        oppPpg: Math.round(oppPpg * 10) / 10,
        recentGames,
      },
    });
  } catch (error) {
    console.error("Team stats API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch team stats" },
      { status: 500 }
    );
  }
}
