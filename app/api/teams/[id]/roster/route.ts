import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const LEAGUE_SLUGS: Record<string, string> = {
  nba: "basketball/nba",
  wnba: "basketball/wnba",
  ncaam: "basketball/mens-college-basketball",
  ncaaw: "basketball/womens-college-basketball",
};

interface EspnAthlete {
  id: string;
  fullName: string;
  displayName: string;
  jersey?: string;
  position?: { abbreviation: string; name: string };
  headshot?: { href: string };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const league = request.nextUrl.searchParams.get("league") || "nba";
    const slug = LEAGUE_SLUGS[league] || "basketball/nba";

    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/${slug}/teams/${id}/roster`,
      { headers: { Accept: "application/json" }, next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      return NextResponse.json({
        success: true,
        teamId: id,
        count: 0,
        players: [],
      });
    }

    const data = await res.json();
    const athletes: EspnAthlete[] = data.athletes || [];

    const players = athletes.map((a) => ({
      id: a.id,
      name: a.fullName || a.displayName,
      firstName: a.displayName?.split(" ")[0] || "",
      lastName: a.displayName?.split(" ").slice(1).join(" ") || "",
      position: a.position?.abbreviation || "",
      jerseyNumber: a.jersey || "",
      headshotUrl: a.headshot?.href || `https://a.espncdn.com/i/headshots/${league}/players/full/${a.id}.png`,
    }));

    return NextResponse.json({
      success: true,
      teamId: id,
      league,
      count: players.length,
      players,
    });
  } catch (error) {
    console.error("Team roster API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch team roster" },
      { status: 500 }
    );
  }
}
