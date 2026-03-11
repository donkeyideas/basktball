import { NextRequest, NextResponse } from "next/server";
import { getEspnSeason } from "@/lib/api/season";

export const dynamic = "force-dynamic";

const ESPN_CORE = "https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba";
const ESPN_SEARCH = "https://site.web.api.espn.com/apis/common/v3/search";

// Helper: find a stat by name across all categories
function findStat(
  categories: Array<{ stats?: Array<{ name: string; value: number }> }>,
  statName: string
): number {
  for (const cat of categories) {
    const stat = cat.stats?.find((s) => s.name === statName);
    if (stat) return stat.value || 0;
  }
  return 0;
}

function round1(val: number): number {
  return Math.round(val * 10) / 10;
}

function emptyStats() {
  return {
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
}

function buildStatsFromCategories(
  categories: Array<{ stats?: Array<{ name: string; value: number }> }>
) {
  const gamesPlayed = findStat(categories, "gamesPlayed");
  const totalMinutes = findStat(categories, "minutes");
  const totalTurnovers = findStat(categories, "turnovers");

  // Rebounds: try avgRebounds first, then total/GP, then defensive+offensive/GP
  let rpg = findStat(categories, "avgRebounds");
  if (rpg === 0 && gamesPlayed > 0) {
    const totalReb = findStat(categories, "totalRebounds");
    if (totalReb > 0) {
      rpg = totalReb / gamesPlayed;
    } else {
      const defReb = findStat(categories, "defensiveRebounds");
      const offReb = findStat(categories, "offensiveRebounds");
      rpg = (defReb + offReb) / gamesPlayed;
    }
  }

  return {
    ppg: round1(findStat(categories, "avgPoints")),
    rpg: round1(rpg),
    apg: round1(findStat(categories, "avgAssists")),
    spg: round1(findStat(categories, "avgSteals")),
    bpg: round1(findStat(categories, "avgBlocks")),
    fgPct: round1(findStat(categories, "fieldGoalPct")),
    threePct: round1(findStat(categories, "threePointPct")),
    ftPct: round1(findStat(categories, "freeThrowPct")),
    mpg: gamesPlayed > 0 ? round1(totalMinutes / gamesPlayed) : 0,
    tov: gamesPlayed > 0 ? round1(totalTurnovers / gamesPlayed) : 0,
    gamesPlayed,
  };
}

// GET - Fetch player season averages from ESPN
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const season = getEspnSeason();

    // Try fetching stats with the given ID
    let statsData: EspnStatsData | null = await fetchEspnStats(id, season);

    // If that fails, try resolving the player by name
    if (!statsData) {
      const playerName = request.nextUrl.searchParams.get("name");
      if (playerName) {
        const espnId = await resolveEspnId(playerName);
        if (espnId && espnId !== id) {
          statsData = await fetchEspnStats(espnId, season);
        }
      }
    }

    if (!statsData) {
      return NextResponse.json({
        success: true,
        stats: emptyStats(),
        source: "none",
      });
    }

    const categories = statsData.splits?.categories || [];
    const stats = buildStatsFromCategories(categories);

    // Also fetch player info for the player detail page
    let player: Record<string, unknown> | undefined;
    if (statsData.athlete?.$ref) {
      try {
        const athleteRes = await fetch(statsData.athlete.$ref);
        if (athleteRes.ok) {
          const athleteData = await athleteRes.json();
          player = {
            id: athleteData.id?.toString() || id,
            name: athleteData.displayName,
            position: athleteData.position?.abbreviation,
          };

          // Resolve team
          if (athleteData.team?.$ref) {
            const teamRes = await fetch(athleteData.team.$ref);
            if (teamRes.ok) {
              const teamData = await teamRes.json();
              player.team = teamData.displayName;
              player.teamAbbr = teamData.abbreviation;
            }
          }
        }
      } catch {
        // Player info fetch failed, stats still work
      }
    }

    return NextResponse.json({
      success: true,
      player,
      stats,
      source: "espn",
    });
  } catch (error) {
    console.error("Error fetching player stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch player stats" },
      { status: 500 }
    );
  }
}

interface EspnStatsData {
  splits?: {
    categories?: Array<{ stats?: Array<{ name: string; value: number }> }>;
  };
  athlete?: { $ref: string };
}

async function fetchEspnStats(
  athleteId: string,
  season: number
): Promise<EspnStatsData | null> {
  try {
    const res = await fetch(
      `${ESPN_CORE}/seasons/${season}/types/2/athletes/${athleteId}/statistics`,
      { next: { revalidate: 900 } } as RequestInit
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function resolveEspnId(name: string): Promise<string | null> {
  try {
    const url = new URL(ESPN_SEARCH);
    url.searchParams.set("query", name);
    url.searchParams.set("limit", "1");
    url.searchParams.set("type", "player");
    url.searchParams.set("sport", "basketball");
    url.searchParams.set("league", "nba");

    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const data = await res.json();
    return data.items?.[0]?.id || null;
  } catch {
    return null;
  }
}
