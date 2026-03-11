import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface EspnStandingsEntry {
  team: {
    id: string;
    displayName: string;
    abbreviation: string;
    logos?: Array<{ href: string }>;
  };
  stats: Array<{
    name: string;
    displayValue: string;
    value: number;
    type: string;
  }>;
}

interface EspnStandingsResponse {
  children: Array<{
    name: string;
    standings: {
      entries: EspnStandingsEntry[];
    };
  }>;
}

const LEAGUE_SLUGS: Record<string, string> = {
  nba: "basketball/nba",
  wnba: "basketball/wnba",
  ncaam: "basketball/mens-college-basketball",
  ncaaw: "basketball/womens-college-basketball",
};

export async function GET(request: NextRequest) {
  const league = request.nextUrl.searchParams.get("league") || "nba";
  const slug = LEAGUE_SLUGS[league] || "basketball/nba";

  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/v2/sports/${slug}/standings`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 900 }, // 15 min cache
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: "Standings not available" },
        { status: 404 }
      );
    }

    const data: EspnStandingsResponse = await res.json();

    if (!data.children?.length) {
      return NextResponse.json(
        { success: false, error: "No standings data" },
        { status: 404 }
      );
    }

    const conferences = data.children.map((conf) => {
      const teams = conf.standings.entries
        .map((entry) => {
          const getStat = (name: string) =>
            entry.stats.find((s) => s.name === name);
          const getDisplay = (name: string) =>
            getStat(name)?.displayValue || "";
          const getValue = (name: string) => getStat(name)?.value ?? 0;

          return {
            id: entry.team.id,
            name: entry.team.displayName,
            abbreviation: entry.team.abbreviation,
            logo:
              entry.team.logos?.[0]?.href ||
              `https://a.espncdn.com/i/teamlogos/nba/500/${entry.team.abbreviation.toLowerCase()}.png`,
            wins: getValue("wins"),
            losses: getValue("losses"),
            winPct: getDisplay("winPercent"),
            gamesBehind: getDisplay("gamesBehind"),
            streak: getDisplay("streak"),
            last10: getDisplay("Last Ten Games"),
            home: getDisplay("Home"),
            road: getDisplay("Road"),
            confRecord: getDisplay("vs. Conf."),
            divRecord: getDisplay("vs. Div."),
            ppg: getValue("avgPointsFor"),
            oppPpg: getValue("avgPointsAgainst"),
            diff: getValue("differential"),
            seed: getValue("playoffSeed"),
          };
        })
        .sort((a, b) => a.seed - b.seed);

      return {
        name: conf.name,
        teams,
      };
    });

    return NextResponse.json({
      success: true,
      league,
      conferences,
    });
  } catch (error) {
    console.error("Standings API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch standings" },
      { status: 500 }
    );
  }
}
