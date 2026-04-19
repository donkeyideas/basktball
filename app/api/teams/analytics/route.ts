import { NextRequest, NextResponse } from "next/server";
import { statsCache, CacheTTL } from "@/lib/cache/redis";
import { getEspnSeason } from "@/lib/api/season";

export const dynamic = "force-dynamic";

interface TeamAnalytics {
  id: string;
  name: string;
  abbreviation: string;
  logoUrl: string;
  wins: number;
  losses: number;
  ppg: number;
  oppPpg: number;
  differential: number;
  streak: number;
  seed: number;
  winPct: number;
}

const ESPN_STANDINGS =
  "https://site.web.api.espn.com/apis/v2/sports/basketball/nba/standings";

interface EspnStandingsResponse {
  children: Array<{
    name: string;
    standings: {
      entries: Array<{
        team: {
          id: string;
          displayName: string;
          abbreviation: string;
          logos: Array<{ href: string }>;
        };
        stats: Array<{
          name: string;
          value: number;
        }>;
      }>;
    };
  }>;
}

// GET - Fetch team analytics from ESPN live standings
export async function GET(_request: NextRequest) {
  try {
    const cacheKey = "team-analytics:all";

    // Check cache first
    try {
      const cached = await statsCache.get<TeamAnalytics[]>(cacheKey);
      if (cached && cached.length > 0) {
        return NextResponse.json({
          success: true,
          teams: cached,
          source: "cache",
        });
      }
    } catch {
      // Cache miss
    }

    const season = getEspnSeason();

    const res = await fetch(`${ESPN_STANDINGS}?season=${season}`, {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      return NextResponse.json({
        success: true,
        teams: [],
        source: "unavailable",
      });
    }

    const data: EspnStandingsResponse = await res.json();

    if (!data?.children) {
      return NextResponse.json({
        success: true,
        teams: [],
        source: "unavailable",
      });
    }

    const teams: TeamAnalytics[] = [];

    for (const conference of data.children) {
      if (!conference.standings?.entries) continue;

      for (const entry of conference.standings.entries) {
        const getStat = (name: string): number => {
          const stat = entry.stats.find((s) => s.name === name);
          return stat?.value ?? 0;
        };

        const wins = getStat("wins");
        const losses = getStat("losses");

        teams.push({
          id: entry.team.id,
          name: entry.team.displayName,
          abbreviation: entry.team.abbreviation,
          logoUrl: entry.team.logos?.[0]?.href || "",
          wins,
          losses,
          ppg: Math.round(getStat("avgPointsFor") * 10) / 10,
          oppPpg: Math.round(getStat("avgPointsAgainst") * 10) / 10,
          differential: Math.round(getStat("differential") * 10) / 10,
          streak: getStat("streak"),
          seed: getStat("playoffSeed"),
          winPct: Math.round(getStat("winPercent") * 1000) / 1000,
        });
      }
    }

    // Sort by win percentage
    teams.sort((a, b) => b.winPct - a.winPct);

    if (teams.length > 0) {
      await statsCache.set(cacheKey, teams, CacheTTL.TEAM_DATA);
    }

    return NextResponse.json({
      success: true,
      teams,
      source: "espn_live",
    });
  } catch (error) {
    console.error("Error fetching team analytics:", error);
    return NextResponse.json({
      success: true,
      teams: [],
      source: "unavailable",
    });
  }
}
