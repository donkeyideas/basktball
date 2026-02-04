import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// NBA.com headshot URL
const getNbaHeadshot = (nbaId: string) =>
  `https://cdn.nba.com/headshots/nba/latest/1040x760/${nbaId}.png`;

// Fallback player data for top NBA players (2025-26 season)
const TOP_PLAYERS: Record<string, {
  name: string;
  team: string;
  teamName: string;
  position: string;
  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
  fgPct: number;
  threePct: number;
  ftPct: number;
  gamesPlayed: number;
}> = {
  "1629029": { name: "Luka Doncic", team: "LAL", teamName: "Los Angeles Lakers", position: "G", ppg: 33.6, rpg: 8.0, apg: 8.8, spg: 1.5, bpg: 0.5, fgPct: 47.5, threePct: 35.2, ftPct: 78.5, gamesPlayed: 40 },
  "1628983": { name: "Shai Gilgeous-Alexander", team: "OKC", teamName: "Oklahoma City Thunder", position: "G", ppg: 32.0, rpg: 4.4, apg: 6.4, spg: 1.3, bpg: 0.8, fgPct: 53.2, threePct: 35.5, ftPct: 88.2, gamesPlayed: 48 },
  "1630162": { name: "Anthony Edwards", team: "MIN", teamName: "Minnesota Timberwolves", position: "G", ppg: 29.7, rpg: 5.2, apg: 3.7, spg: 1.3, bpg: 0.8, fgPct: 45.2, threePct: 35.8, ftPct: 84.5, gamesPlayed: 41 },
  "1627759": { name: "Jaylen Brown", team: "BOS", teamName: "Boston Celtics", position: "G-F", ppg: 29.4, rpg: 6.9, apg: 4.8, spg: 1.0, bpg: 0.4, fgPct: 50.5, threePct: 36.8, ftPct: 73.5, gamesPlayed: 45 },
  "1630224": { name: "Tyrese Maxey", team: "PHI", teamName: "Philadelphia 76ers", position: "G", ppg: 29.2, rpg: 4.2, apg: 6.9, spg: 2.0, bpg: 0.9, fgPct: 45.8, threePct: 38.2, ftPct: 88.5, gamesPlayed: 47 },
  "1628378": { name: "Donovan Mitchell", team: "CLE", teamName: "Cleveland Cavaliers", position: "G", ppg: 28.8, rpg: 4.6, apg: 5.8, spg: 1.5, bpg: 0.2, fgPct: 46.8, threePct: 39.2, ftPct: 87.2, gamesPlayed: 47 },
  "202695": { name: "Kawhi Leonard", team: "LAC", teamName: "Los Angeles Clippers", position: "F", ppg: 27.6, rpg: 6.1, apg: 3.6, spg: 2.1, bpg: 0.6, fgPct: 51.2, threePct: 39.5, ftPct: 88.8, gamesPlayed: 36 },
  "1628374": { name: "Lauri Markkanen", team: "UTA", teamName: "Utah Jazz", position: "F", ppg: 27.4, rpg: 7.1, apg: 2.2, spg: 1.1, bpg: 0.6, fgPct: 46.2, threePct: 38.8, ftPct: 89.2, gamesPlayed: 36 },
  "201939": { name: "Stephen Curry", team: "GSW", teamName: "Golden State Warriors", position: "G", ppg: 27.2, rpg: 5.2, apg: 4.8, spg: 1.1, bpg: 0.4, fgPct: 45.5, threePct: 41.5, ftPct: 92.5, gamesPlayed: 39 },
  "1628973": { name: "Jalen Brunson", team: "NYK", teamName: "New York Knicks", position: "G", ppg: 27.2, rpg: 3.5, apg: 6.1, spg: 0.7, bpg: 0.1, fgPct: 47.2, threePct: 38.5, ftPct: 84.2, gamesPlayed: 44 },
  "201142": { name: "Kevin Durant", team: "HOU", teamName: "Houston Rockets", position: "F", ppg: 26.2, rpg: 5.8, apg: 4.6, spg: 0.7, bpg: 0.9, fgPct: 52.8, threePct: 40.5, ftPct: 86.5, gamesPlayed: 45 },
  "1628966": { name: "Michael Porter Jr.", team: "BKN", teamName: "Brooklyn Nets", position: "F", ppg: 25.6, rpg: 7.3, apg: 3.2, spg: 1.1, bpg: 0.3, fgPct: 48.5, threePct: 38.5, ftPct: 85.2, gamesPlayed: 38 },
  "1628969": { name: "Jamal Murray", team: "DEN", teamName: "Denver Nuggets", position: "G", ppg: 25.5, rpg: 4.2, apg: 7.5, spg: 1.0, bpg: 0.4, fgPct: 48.5, threePct: 37.2, ftPct: 86.8, gamesPlayed: 45 },
  "1630166": { name: "Deni Avdija", team: "POR", teamName: "Portland Trail Blazers", position: "F", ppg: 25.5, rpg: 7.2, apg: 6.7, spg: 0.8, bpg: 0.6, fgPct: 46.5, threePct: 36.2, ftPct: 82.5, gamesPlayed: 44 },
  "1626164": { name: "Devin Booker", team: "PHX", teamName: "Phoenix Suns", position: "G", ppg: 25.4, rpg: 4.5, apg: 6.2, spg: 1.3, bpg: 0.4, fgPct: 48.8, threePct: 38.5, ftPct: 89.2, gamesPlayed: 41 },
  "201935": { name: "James Harden", team: "LAC", teamName: "Los Angeles Clippers", position: "G", ppg: 25.4, rpg: 5.5, apg: 8.1, spg: 1.3, bpg: 0.4, fgPct: 44.2, threePct: 36.5, ftPct: 88.5, gamesPlayed: 44 },
  "1630595": { name: "Cade Cunningham", team: "DET", teamName: "Detroit Pistons", position: "G", ppg: 25.2, rpg: 4.8, apg: 9.8, spg: 1.5, bpg: 0.3, fgPct: 44.8, threePct: 35.5, ftPct: 85.2, gamesPlayed: 42 },
  "1630524": { name: "Keyonte George", team: "UTA", teamName: "Utah Jazz", position: "G", ppg: 25.2, rpg: 4.2, apg: 2.6, spg: 1.2, bpg: 0.2, fgPct: 42.5, threePct: 35.2, ftPct: 85.8, gamesPlayed: 43 },
  "1641705": { name: "Victor Wembanyama", team: "SAS", teamName: "San Antonio Spurs", position: "C", ppg: 24.2, rpg: 10.8, apg: 4.0, spg: 0.9, bpg: 2.0, fgPct: 47.8, threePct: 34.5, ftPct: 80.2, gamesPlayed: 51 },
  "1627783": { name: "Pascal Siakam", team: "IND", teamName: "Indiana Pacers", position: "F", ppg: 23.8, rpg: 6.9, apg: 4.9, spg: 0.9, bpg: 0.2, fgPct: 49.5, threePct: 33.5, ftPct: 78.5, gamesPlayed: 48 },
  "1629636": { name: "Jalen Johnson", team: "ATL", teamName: "Atlanta Hawks", position: "F", ppg: 23.1, rpg: 3.6, apg: 1.8, spg: 0.5, bpg: 0.4, fgPct: 48.2, threePct: 33.2, ftPct: 75.8, gamesPlayed: 46 },
  "1626181": { name: "Norman Powell", team: "MIA", teamName: "Miami Heat", position: "G", ppg: 23.0, rpg: 6.8, apg: 4.0, spg: 0.6, bpg: 0.3, fgPct: 47.8, threePct: 40.2, ftPct: 86.5, gamesPlayed: 43 },
  "203944": { name: "Julius Randle", team: "MIN", teamName: "Minnesota Timberwolves", position: "F", ppg: 22.2, rpg: 10.5, apg: 5.4, spg: 0.6, bpg: 0.4, fgPct: 45.2, threePct: 35.5, ftPct: 78.2, gamesPlayed: 47 },
  "1627742": { name: "Brandon Ingram", team: "TOR", teamName: "Toronto Raptors", position: "F", ppg: 21.9, rpg: 5.9, apg: 3.7, spg: 0.6, bpg: 0.4, fgPct: 47.5, threePct: 34.8, ftPct: 82.5, gamesPlayed: 49 },
  "1630549": { name: "Shaedon Sharpe", team: "POR", teamName: "Portland Trail Blazers", position: "G", ppg: 21.8, rpg: 4.5, apg: 3.6, spg: 0.6, bpg: 0.3, fgPct: 45.8, threePct: 36.5, ftPct: 84.2, gamesPlayed: 46 },
  // Legacy players still referenced
  "2544": { name: "LeBron James", team: "LAL", teamName: "Los Angeles Lakers", position: "F", ppg: 18.5, rpg: 6.2, apg: 7.5, spg: 0.7, bpg: 0.4, fgPct: 50.2, threePct: 37.5, ftPct: 74.2, gamesPlayed: 35 },
};

// GET - Fetch player details by NBA ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if we have fallback data for this player
    const playerData = TOP_PLAYERS[id];

    if (playerData) {
      return NextResponse.json({
        success: true,
        player: {
          id,
          name: playerData.name,
          team: playerData.teamName,
          teamAbbr: playerData.team,
          position: playerData.position,
          headshotUrl: getNbaHeadshot(id),
        },
        stats: {
          ppg: playerData.ppg,
          rpg: playerData.rpg,
          apg: playerData.apg,
          spg: playerData.spg,
          bpg: playerData.bpg,
          fgPct: playerData.fgPct,
          threePct: playerData.threePct,
          ftPct: playerData.ftPct,
          mpg: 0,
          tov: 0,
          gamesPlayed: playerData.gamesPlayed,
        },
        source: "nba_fallback",
      });
    }

    // Try to fetch from ESPN - athlete info and overview (which includes stats)
    try {
      const [espnRes, overviewRes] = await Promise.all([
        fetch(
          `https://site.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${id}`,
          { headers: { Accept: "application/json" } }
        ),
        fetch(
          `https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${id}/overview`,
          { headers: { Accept: "application/json" } }
        ),
      ]);

      if (espnRes.ok) {
        const espnData = await espnRes.json();
        const athlete = espnData.athlete;

        // Parse statistics from overview endpoint
        let stats = {
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
            // ESPN overview returns: labels array and splits array with stats arrays
            // labels: ["GP","MIN","FG%","3P%","FT%","REB","AST","BLK","STL","PF","TO","PTS"]
            // splits[0].stats: ["41","26.7","41.6","32.1","70.0","5.7","5.3","0.7","0.9","3.2","2.8","8.4"]
            const labels = overviewData.statistics?.labels || [];
            const regularSeason = overviewData.statistics?.splits?.find(
              (s: { displayName: string }) => s.displayName === "Regular Season"
            );
            const statValues = regularSeason?.stats || [];

            // Map labels to stats
            labels.forEach((label: string, index: number) => {
              const value = parseFloat(statValues[index]) || 0;
              switch (label) {
                case "PTS":
                  stats.ppg = value;
                  break;
                case "REB":
                  stats.rpg = value;
                  break;
                case "AST":
                  stats.apg = value;
                  break;
                case "STL":
                  stats.spg = value;
                  break;
                case "BLK":
                  stats.bpg = value;
                  break;
                case "FG%":
                  stats.fgPct = value;
                  break;
                case "3P%":
                  stats.threePct = value;
                  break;
                case "FT%":
                  stats.ftPct = value;
                  break;
                case "MIN":
                  stats.mpg = value;
                  break;
                case "TO":
                  stats.tov = value;
                  break;
                case "GP":
                  stats.gamesPlayed = value;
                  break;
              }
            });
          } catch {
            console.error("Failed to parse ESPN overview stats");
          }
        }

        if (athlete) {
          // Clean up weight - ESPN returns "230 lbs" but we want just the number
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
              headshotUrl: athlete.headshot?.href || getNbaHeadshot(id),
            },
            stats,
            source: "espn",
          });
        }
      }
    } catch (espnError) {
      console.error("ESPN fetch failed:", espnError);
    }

    return NextResponse.json(
      { success: false, error: "Player not found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error fetching player:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch player" },
      { status: 500 }
    );
  }
}
