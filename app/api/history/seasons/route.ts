import { NextResponse } from "next/server";

// =============================================================================
// ESPN API-powered NBA Season History
// All data fetched from ESPN's verified API — no hardcoded fallback data
// =============================================================================

const ESPN_CORE = "https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba";
const FETCH_OPTIONS: RequestInit = { next: { revalidate: 86400 } } as RequestInit; // Cache 24h

// ESPN Award IDs
const AWARD_MVP = 33;
const AWARD_FINALS_MVP = 43;

// Extract numeric ID from ESPN $ref URL
function extractId(refUrl: string): string | null {
  const match = refUrl.match(/\/(\d+)(?:\?|$)/);
  return match ? match[1] : null;
}

// In-request cache to avoid resolving the same athlete/team twice
const athleteCache = new Map<string, { name: string; id: string; headshot: string }>();
const teamCache = new Map<string, { name: string; id: string; logo: string; abbreviation: string }>();

async function resolveAthlete(refUrl: string) {
  const id = extractId(refUrl);
  if (!id) return null;
  if (athleteCache.has(id)) return athleteCache.get(id)!;

  try {
    const res = await fetch(refUrl, FETCH_OPTIONS);
    if (!res.ok) return null;
    const data = await res.json();
    const athleteId = String(data.id || id);
    const athlete = {
      name: data.displayName || data.fullName || "Unknown",
      id: athleteId,
      headshot: data.headshot?.href || `https://a.espncdn.com/i/headshots/nba/players/full/${athleteId}.png`,
    };
    athleteCache.set(id, athlete);
    return athlete;
  } catch {
    return null;
  }
}

async function resolveTeam(refUrl: string) {
  const id = extractId(refUrl);
  if (!id) return null;
  if (teamCache.has(id)) return teamCache.get(id)!;

  try {
    const res = await fetch(refUrl, FETCH_OPTIONS);
    if (!res.ok) return null;
    const data = await res.json();
    const teamId = String(data.id || id);
    const team = {
      name: data.displayName || data.name || "Unknown",
      id: teamId,
      logo: data.logos?.[0]?.href || `https://a.espncdn.com/i/teamlogos/nba/500/${teamId}.png`,
      abbreviation: data.abbreviation || "",
    };
    teamCache.set(id, team);
    return team;
  } catch {
    return null;
  }
}

// Fetch all data for a single NBA season from ESPN
async function fetchSeasonFromESPN(year: number) {
  try {
    // Fetch MVP award, Finals MVP award (→ champion), and scoring leaders in parallel
    const [mvpRes, fmvpRes, leadersRes] = await Promise.all([
      fetch(`${ESPN_CORE}/seasons/${year}/awards/${AWARD_MVP}`, FETCH_OPTIONS),
      fetch(`${ESPN_CORE}/seasons/${year}/awards/${AWARD_FINALS_MVP}`, FETCH_OPTIONS),
      fetch(`${ESPN_CORE}/seasons/${year}/types/2/leaders`, FETCH_OPTIONS),
    ]);

    const [mvpData, fmvpData, leadersData] = await Promise.all([
      mvpRes.ok ? mvpRes.json() : null,
      fmvpRes.ok ? fmvpRes.json() : null,
      leadersRes.ok ? leadersRes.json() : null,
    ]);

    // Extract $ref URLs from responses
    const mvpAthleteRef = mvpData?.winners?.[0]?.athlete?.$ref as string | undefined;
    const fmvpTeamRef = fmvpData?.winners?.[0]?.team?.$ref as string | undefined;

    // Get scoring leader from leaders categories
    const ppgCategory = leadersData?.categories?.find(
      (c: { name: string }) => c.name === "pointsPerGame"
    );
    const scoringLeaderEntry = ppgCategory?.leaders?.[0];
    const scorerAthleteRef = scoringLeaderEntry?.athlete?.$ref as string | undefined;

    // Resolve all athlete/team refs in parallel
    const [mvpAthlete, championTeam, scorerAthlete] = await Promise.all([
      mvpAthleteRef ? resolveAthlete(mvpAthleteRef) : null,
      fmvpTeamRef ? resolveTeam(fmvpTeamRef) : null,
      scorerAthleteRef ? resolveAthlete(scorerAthleteRef) : null,
    ]);

    const displayYear = `${year - 1}-${String(year).slice(2)}`; // e.g., "2024-25"

    return {
      year: displayYear,
      champion: championTeam?.name || "TBD",
      championLogo: championTeam?.logo || null,
      championAbbreviation: championTeam?.abbreviation || "",
      mvp: mvpAthlete?.name || "TBD",
      mvpHeadshot: mvpAthlete?.headshot || null,
      mvpEspnId: mvpAthlete?.id || null,
      topScorer: scorerAthlete?.name || "TBD",
      topScorerHeadshot: scorerAthlete?.headshot || null,
      topScorerEspnId: scorerAthlete?.id || null,
      topScorerPpg: parseFloat(scoringLeaderEntry?.displayValue || "0") || 0,
      finalsScore: "", // Series score not available from awards endpoint
    };
  } catch (error) {
    console.error(`Error fetching ESPN data for season ${year}:`, error);
    return null;
  }
}

// GET - Fetch season history from ESPN API
export async function GET() {
  try {
    const years = [2025, 2024, 2023, 2022, 2021, 2020];
    const results = await Promise.all(years.map(fetchSeasonFromESPN));
    const seasons = results.filter(Boolean);

    if (seasons.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Unable to fetch season data from ESPN",
      }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      seasons,
      source: "espn",
    });
  } catch (error) {
    console.error("Error fetching season history:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch season history",
    }, { status: 500 });
  }
}
