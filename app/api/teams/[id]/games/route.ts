import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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

    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/${slug}/teams/${id}/schedule`,
      { headers: { Accept: "application/json" }, next: { revalidate: 900 } }
    );

    if (!res.ok) {
      return NextResponse.json({
        success: true,
        teamId: id,
        count: 0,
        games: [],
      });
    }

    const data = await res.json();
    const events = data.events || [];

    const games = events.map((e: any) => {
      const comp = e.competitions?.[0];
      if (!comp) return null;

      const homeComp = comp.competitors?.find((c: any) => c.homeAway === "home");
      const awayComp = comp.competitors?.find((c: any) => c.homeAway === "away");
      if (!homeComp || !awayComp) return null;

      const status = comp.status?.type;
      let gameStatus: "scheduled" | "live" | "final" = "scheduled";
      if (status?.completed) gameStatus = "final";
      else if (status?.state === "in") gameStatus = "live";

      const leagueSlug = league === "ncaam" ? "mens-college-basketball" : league === "ncaaw" ? "womens-college-basketball" : league;
      const getLogo = (abbr: string) =>
        `https://a.espncdn.com/i/teamlogos/${leagueSlug}/500/${abbr.toLowerCase()}.png`;

      return {
        id: e.id,
        homeTeam: {
          id: homeComp.team.id,
          name: homeComp.team.name || homeComp.team.displayName,
          abbreviation: homeComp.team.abbreviation,
          city: homeComp.team.displayName?.replace(` ${homeComp.team.name}`, "") || "",
          logoUrl: homeComp.team.logos?.[0]?.href || getLogo(homeComp.team.abbreviation),
        },
        awayTeam: {
          id: awayComp.team.id,
          name: awayComp.team.name || awayComp.team.displayName,
          abbreviation: awayComp.team.abbreviation,
          city: awayComp.team.displayName?.replace(` ${awayComp.team.name}`, "") || "",
          logoUrl: awayComp.team.logos?.[0]?.href || getLogo(awayComp.team.abbreviation),
        },
        homeScore: parseInt(homeComp.score?.displayValue || "0"),
        awayScore: parseInt(awayComp.score?.displayValue || "0"),
        status: gameStatus,
        gameDate: e.date,
      };
    }).filter(Boolean);

    return NextResponse.json({
      success: true,
      teamId: id,
      league,
      count: games.length,
      games,
    });
  } catch (error) {
    console.error("Team games API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch team games" },
      { status: 500 }
    );
  }
}
