import { NextResponse } from "next/server";
import { getEspnSeason } from "@/lib/api/season";

// =============================================================================
// ESPN API-powered NBA Championship Counts
// Fetches recent champions from ESPN Finals MVP award, combined with
// verified historical base counts from NBA records (pre-2020 data).
// =============================================================================

const ESPN_CORE = "https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba";
const FETCH_OPTIONS: RequestInit = { next: { revalidate: 86400 } } as RequestInit;
const AWARD_FINALS_MVP = 43;

interface ChampionshipCount {
  team: string;
  count: number;
  lastWon: string;
  logo: string | null;
}

function extractId(refUrl: string): string | null {
  const match = refUrl.match(/\/(\d+)(?:\?|$)/);
  return match ? match[1] : null;
}

// Verified historical championship counts BEFORE the 2019-20 season.
// These are permanent facts from NBA history that will never change.
// ESPN API fetches 2020-2025 to add recent champions on top of this base.
// Source: NBA.com official championship list
const BASE_CHAMPIONSHIPS: Record<string, { count: number; lastWon: string }> = {
  "Boston Celtics": { count: 17, lastWon: "2008" },
  "Los Angeles Lakers": { count: 16, lastWon: "2010" },
  "Golden State Warriors": { count: 6, lastWon: "2018" },
  "Chicago Bulls": { count: 6, lastWon: "1998" },
  "San Antonio Spurs": { count: 5, lastWon: "2014" },
  "Miami Heat": { count: 3, lastWon: "2013" },
  "Detroit Pistons": { count: 3, lastWon: "2004" },
  "Philadelphia 76ers": { count: 3, lastWon: "1983" },
  "Houston Rockets": { count: 2, lastWon: "1995" },
  "New York Knicks": { count: 2, lastWon: "1973" },
  "Oklahoma City Thunder": { count: 1, lastWon: "1979" }, // As Seattle SuperSonics (1979)
  "Milwaukee Bucks": { count: 1, lastWon: "1971" }, // ESPN 2020-2025 fetch adds 2021 championship
  "Portland Trail Blazers": { count: 1, lastWon: "1977" },
  "Washington Wizards": { count: 1, lastWon: "1978" }, // As Washington Bullets
  "Atlanta Hawks": { count: 1, lastWon: "1958" }, // As St. Louis Hawks
  "Sacramento Kings": { count: 1, lastWon: "1951" }, // As Rochester Royals
  "Cleveland Cavaliers": { count: 1, lastWon: "2016" },
  "Dallas Mavericks": { count: 1, lastWon: "2011" },
  "Toronto Raptors": { count: 1, lastWon: "2019" },
};

// Fetch champion for a given season year from ESPN Finals MVP award
async function fetchChampion(year: number): Promise<{ team: string; logo: string | null; year: string } | null> {
  try {
    const res = await fetch(`${ESPN_CORE}/seasons/${year}/awards/${AWARD_FINALS_MVP}`, FETCH_OPTIONS);
    if (!res.ok) return null;
    const data = await res.json();

    const teamRef = data?.winners?.[0]?.team?.$ref as string | undefined;
    if (!teamRef) return null;

    const teamRes = await fetch(teamRef, FETCH_OPTIONS);
    if (!teamRes.ok) return null;
    const teamData = await teamRes.json();

    return {
      team: teamData.displayName || teamData.name || "Unknown",
      logo: teamData.logos?.[0]?.href || null,
      year: String(year),
    };
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    // Fetch recent champions from ESPN (2020 through current season)
    // ESPN uses end year: 2020 = 2019-20 season
    const currentSeason = getEspnSeason();
    const recentYears = Array.from(
      { length: currentSeason - 2019 },
      (_, i) => currentSeason - i
    );
    const recentChampions = await Promise.all(recentYears.map(fetchChampion));

    // Start with base historical counts
    const counts: Record<string, { count: number; lastWon: string; logo: string | null }> = {};
    for (const [team, data] of Object.entries(BASE_CHAMPIONSHIPS)) {
      counts[team] = { count: data.count, lastWon: data.lastWon, logo: null };
    }

    // Add ESPN-verified recent champions
    for (const champ of recentChampions) {
      if (!champ) continue;
      if (!counts[champ.team]) {
        counts[champ.team] = { count: 0, lastWon: champ.year, logo: champ.logo };
      }
      counts[champ.team].count++;
      // Update lastWon if this year is more recent
      if (parseInt(champ.year) > parseInt(counts[champ.team].lastWon)) {
        counts[champ.team].lastWon = champ.year;
      }
      if (champ.logo) {
        counts[champ.team].logo = champ.logo;
      }
    }

    const championships: ChampionshipCount[] = Object.entries(counts)
      .map(([team, data]) => ({
        team,
        count: data.count,
        lastWon: data.lastWon,
        logo: data.logo,
      }))
      .sort((a, b) => b.count - a.count || a.team.localeCompare(b.team));

    return NextResponse.json({
      success: true,
      championships,
      source: "espn+historical",
    });
  } catch (error) {
    console.error("Error fetching championship counts:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch championship data",
    }, { status: 500 });
  }
}
