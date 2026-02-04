import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// NBA.com headshot URL
const getNbaHeadshot = (nbaId: string) =>
  `https://cdn.nba.com/headshots/nba/latest/1040x760/${nbaId}.png`;

// Fallback player data for top NBA players (from stats/leaders)
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
  "1629029": { name: "Luka Doncic", team: "DAL", teamName: "Dallas Mavericks", position: "G", ppg: 33.9, rpg: 9.2, apg: 9.8, spg: 1.4, bpg: 0.5, fgPct: 48.7, threePct: 35.4, ftPct: 78.6, gamesPlayed: 45 },
  "1628983": { name: "Shai Gilgeous-Alexander", team: "OKC", teamName: "Oklahoma City Thunder", position: "G", ppg: 31.4, rpg: 5.5, apg: 6.2, spg: 2.0, bpg: 0.9, fgPct: 53.5, threePct: 35.3, ftPct: 87.4, gamesPlayed: 48 },
  "203507": { name: "Giannis Antetokounmpo", team: "MIL", teamName: "Milwaukee Bucks", position: "F", ppg: 31.2, rpg: 11.8, apg: 6.5, spg: 1.2, bpg: 1.5, fgPct: 60.5, threePct: 27.1, ftPct: 65.7, gamesPlayed: 42 },
  "203954": { name: "Joel Embiid", team: "PHI", teamName: "Philadelphia 76ers", position: "C", ppg: 27.9, rpg: 10.8, apg: 3.2, spg: 1.0, bpg: 1.7, fgPct: 52.1, threePct: 38.8, ftPct: 88.2, gamesPlayed: 25 },
  "1628369": { name: "Jayson Tatum", team: "BOS", teamName: "Boston Celtics", position: "F", ppg: 27.5, rpg: 8.3, apg: 5.0, spg: 1.0, bpg: 0.6, fgPct: 45.8, threePct: 37.6, ftPct: 83.2, gamesPlayed: 47 },
  "203999": { name: "Nikola Jokic", team: "DEN", teamName: "Denver Nuggets", position: "C", ppg: 26.8, rpg: 13.1, apg: 10.2, spg: 1.4, bpg: 0.9, fgPct: 58.2, threePct: 36.4, ftPct: 81.7, gamesPlayed: 48 },
  "1629027": { name: "Trae Young", team: "ATL", teamName: "Atlanta Hawks", position: "G", ppg: 26.1, rpg: 3.0, apg: 11.4, spg: 1.3, bpg: 0.2, fgPct: 43.0, threePct: 34.2, ftPct: 86.5, gamesPlayed: 44 },
  "201142": { name: "Kevin Durant", team: "PHX", teamName: "Phoenix Suns", position: "F", ppg: 27.2, rpg: 6.3, apg: 5.2, spg: 0.9, bpg: 1.2, fgPct: 52.3, threePct: 42.1, ftPct: 85.6, gamesPlayed: 40 },
  "1626164": { name: "Devin Booker", team: "PHX", teamName: "Phoenix Suns", position: "G", ppg: 25.8, rpg: 4.2, apg: 6.8, spg: 1.8, bpg: 0.3, fgPct: 49.2, threePct: 38.9, ftPct: 88.1, gamesPlayed: 45 },
  "203076": { name: "Anthony Davis", team: "LAL", teamName: "Los Angeles Lakers", position: "F-C", ppg: 25.4, rpg: 11.7, apg: 3.5, spg: 1.2, bpg: 2.3, fgPct: 55.6, threePct: 32.4, ftPct: 81.3, gamesPlayed: 42 },
  "203506": { name: "Domantas Sabonis", team: "SAC", teamName: "Sacramento Kings", position: "F-C", ppg: 19.8, rpg: 14.2, apg: 7.1, spg: 0.9, bpg: 0.5, fgPct: 59.4, threePct: 32.7, ftPct: 73.6, gamesPlayed: 48 },
  "1641705": { name: "Victor Wembanyama", team: "SAS", teamName: "San Antonio Spurs", position: "C", ppg: 21.4, rpg: 10.1, apg: 3.6, spg: 1.0, bpg: 3.8, fgPct: 46.5, threePct: 32.8, ftPct: 79.2, gamesPlayed: 47 },
  "203497": { name: "Rudy Gobert", team: "MIN", teamName: "Minnesota Timberwolves", position: "C", ppg: 13.5, rpg: 10.8, apg: 1.3, spg: 0.6, bpg: 2.1, fgPct: 66.8, threePct: 0.0, ftPct: 68.9, gamesPlayed: 46 },
  "1628368": { name: "De'Aaron Fox", team: "SAC", teamName: "Sacramento Kings", position: "G", ppg: 26.8, rpg: 4.5, apg: 6.0, spg: 2.1, bpg: 0.4, fgPct: 47.2, threePct: 33.5, ftPct: 73.8, gamesPlayed: 48 },
  "1629639": { name: "Tyrese Haliburton", team: "IND", teamName: "Indiana Pacers", position: "G", ppg: 19.2, rpg: 3.8, apg: 9.5, spg: 1.2, bpg: 0.5, fgPct: 44.8, threePct: 36.4, ftPct: 85.2, gamesPlayed: 40 },
  "1630163": { name: "LaMelo Ball", team: "CHA", teamName: "Charlotte Hornets", position: "G", ppg: 22.5, rpg: 5.8, apg: 8.2, spg: 1.5, bpg: 0.4, fgPct: 43.5, threePct: 35.8, ftPct: 87.1, gamesPlayed: 35 },
  "1628991": { name: "Jaren Jackson Jr.", team: "MEM", teamName: "Memphis Grizzlies", position: "F-C", ppg: 21.5, rpg: 5.8, apg: 1.8, spg: 0.8, bpg: 1.8, fgPct: 47.1, threePct: 32.4, ftPct: 79.5, gamesPlayed: 40 },
  "203081": { name: "Damian Lillard", team: "MIL", teamName: "Milwaukee Bucks", position: "G", ppg: 25.1, rpg: 4.5, apg: 7.3, spg: 1.0, bpg: 0.3, fgPct: 43.8, threePct: 36.2, ftPct: 91.4, gamesPlayed: 44 },
  "202691": { name: "Klay Thompson", team: "DAL", teamName: "Dallas Mavericks", position: "G", ppg: 14.2, rpg: 3.5, apg: 2.1, spg: 0.6, bpg: 0.5, fgPct: 43.5, threePct: 38.5, ftPct: 92.1, gamesPlayed: 46 },
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
