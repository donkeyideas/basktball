// Server-callable standings getter. Extracted from app/api/standings/route.ts
// so both the route and server pages can call it directly.

export interface StandingsTeam {
  id: string;
  name: string;
  abbreviation: string;
  logo: string;
  wins: number;
  losses: number;
  winPct: string;
  gamesBehind: string;
  streak: string;
  last10: string;
  home: string;
  road: string;
  confRecord: string;
  divRecord: string;
  ppg: number;
  oppPpg: number;
  diff: number;
  seed: number;
}

export interface Conference {
  name: string;
  teams: StandingsTeam[];
}

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

/**
 * Fetch + normalize standings for a league from ESPN. Returns null when no
 * standings data is available (caller decides how to surface that).
 */
export async function getStandings(league: string): Promise<Conference[] | null> {
  const slug = LEAGUE_SLUGS[league] || "basketball/nba";

  const res = await fetch(
    `https://site.api.espn.com/apis/v2/sports/${slug}/standings`,
    {
      headers: { Accept: "application/json" },
      next: { revalidate: 900 }, // 15 min cache
    }
  );

  if (!res.ok) return null;

  const data: EspnStandingsResponse = await res.json();
  if (!data.children?.length) return null;

  return data.children.map((conf) => {
    const teams = conf.standings.entries
      .map((entry) => {
        const getStat = (name: string) => entry.stats.find((s) => s.name === name);
        const getDisplay = (name: string) => getStat(name)?.displayValue || "";
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

    return { name: conf.name, teams };
  });
}
