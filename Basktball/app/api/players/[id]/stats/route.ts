import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// 2025-26 Season stats for top NBA players
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
  mpg: number;
  tov: number;
  gamesPlayed: number;
}> = {
  "1629029": { name: "Luka Doncic", team: "LAL", teamName: "Los Angeles Lakers", position: "G", ppg: 33.6, rpg: 8.0, apg: 8.8, spg: 1.5, bpg: 0.5, fgPct: 47.5, threePct: 35.2, ftPct: 78.5, mpg: 37.5, tov: 4.2, gamesPlayed: 40 },
  "1628983": { name: "Shai Gilgeous-Alexander", team: "OKC", teamName: "Oklahoma City Thunder", position: "G", ppg: 32.0, rpg: 4.4, apg: 6.4, spg: 1.3, bpg: 0.8, fgPct: 53.2, threePct: 35.5, ftPct: 88.2, mpg: 34.5, tov: 2.5, gamesPlayed: 48 },
  "1630162": { name: "Anthony Edwards", team: "MIN", teamName: "Minnesota Timberwolves", position: "G", ppg: 29.7, rpg: 5.2, apg: 3.7, spg: 1.3, bpg: 0.8, fgPct: 45.2, threePct: 35.8, ftPct: 84.5, mpg: 35.8, tov: 3.2, gamesPlayed: 41 },
  "1627759": { name: "Jaylen Brown", team: "BOS", teamName: "Boston Celtics", position: "G-F", ppg: 29.4, rpg: 6.9, apg: 4.8, spg: 1.0, bpg: 0.4, fgPct: 50.5, threePct: 36.8, ftPct: 73.5, mpg: 35.2, tov: 2.5, gamesPlayed: 45 },
  "1630224": { name: "Tyrese Maxey", team: "PHI", teamName: "Philadelphia 76ers", position: "G", ppg: 29.2, rpg: 4.2, apg: 6.9, spg: 2.0, bpg: 0.9, fgPct: 45.8, threePct: 38.2, ftPct: 88.5, mpg: 35.5, tov: 2.2, gamesPlayed: 47 },
  "1628378": { name: "Donovan Mitchell", team: "CLE", teamName: "Cleveland Cavaliers", position: "G", ppg: 28.8, rpg: 4.6, apg: 5.8, spg: 1.5, bpg: 0.2, fgPct: 46.8, threePct: 39.2, ftPct: 87.2, mpg: 34.8, tov: 2.5, gamesPlayed: 47 },
  "202695": { name: "Kawhi Leonard", team: "LAC", teamName: "Los Angeles Clippers", position: "F", ppg: 27.6, rpg: 6.1, apg: 3.6, spg: 2.1, bpg: 0.6, fgPct: 51.2, threePct: 39.5, ftPct: 88.8, mpg: 33.5, tov: 2.2, gamesPlayed: 36 },
  "1628374": { name: "Lauri Markkanen", team: "UTA", teamName: "Utah Jazz", position: "F", ppg: 27.4, rpg: 7.1, apg: 2.2, spg: 1.1, bpg: 0.6, fgPct: 46.2, threePct: 38.8, ftPct: 89.2, mpg: 34.2, tov: 2.2, gamesPlayed: 36 },
  "201939": { name: "Stephen Curry", team: "GSW", teamName: "Golden State Warriors", position: "G", ppg: 27.2, rpg: 5.2, apg: 4.8, spg: 1.1, bpg: 0.4, fgPct: 45.5, threePct: 41.5, ftPct: 92.5, mpg: 33.5, tov: 3.0, gamesPlayed: 39 },
  "1628973": { name: "Jalen Brunson", team: "NYK", teamName: "New York Knicks", position: "G", ppg: 27.2, rpg: 3.5, apg: 6.1, spg: 0.7, bpg: 0.1, fgPct: 47.2, threePct: 38.5, ftPct: 84.2, mpg: 35.5, tov: 2.8, gamesPlayed: 44 },
  "201142": { name: "Kevin Durant", team: "HOU", teamName: "Houston Rockets", position: "F", ppg: 26.2, rpg: 5.8, apg: 4.6, spg: 0.7, bpg: 0.9, fgPct: 52.8, threePct: 40.5, ftPct: 86.5, mpg: 35.5, tov: 2.8, gamesPlayed: 45 },
  "1628966": { name: "Michael Porter Jr.", team: "BKN", teamName: "Brooklyn Nets", position: "F", ppg: 25.6, rpg: 7.3, apg: 3.2, spg: 1.1, bpg: 0.3, fgPct: 48.5, threePct: 38.5, ftPct: 85.2, mpg: 34.2, tov: 2.2, gamesPlayed: 38 },
  "1628969": { name: "Jamal Murray", team: "DEN", teamName: "Denver Nuggets", position: "G", ppg: 25.5, rpg: 4.2, apg: 7.5, spg: 1.0, bpg: 0.4, fgPct: 48.5, threePct: 37.2, ftPct: 86.8, mpg: 34.5, tov: 2.8, gamesPlayed: 45 },
  "1630166": { name: "Deni Avdija", team: "POR", teamName: "Portland Trail Blazers", position: "F", ppg: 25.5, rpg: 7.2, apg: 6.7, spg: 0.8, bpg: 0.6, fgPct: 46.5, threePct: 36.2, ftPct: 82.5, mpg: 35.2, tov: 2.5, gamesPlayed: 44 },
  "1626164": { name: "Devin Booker", team: "PHX", teamName: "Phoenix Suns", position: "G", ppg: 25.4, rpg: 4.5, apg: 6.2, spg: 1.3, bpg: 0.4, fgPct: 48.8, threePct: 38.5, ftPct: 89.2, mpg: 35.2, tov: 2.5, gamesPlayed: 41 },
  "201935": { name: "James Harden", team: "LAC", teamName: "Los Angeles Clippers", position: "G", ppg: 25.4, rpg: 5.5, apg: 8.1, spg: 1.3, bpg: 0.4, fgPct: 44.2, threePct: 36.5, ftPct: 88.5, mpg: 34.5, tov: 3.8, gamesPlayed: 44 },
  "1630595": { name: "Cade Cunningham", team: "DET", teamName: "Detroit Pistons", position: "G", ppg: 25.2, rpg: 4.8, apg: 9.8, spg: 1.5, bpg: 0.3, fgPct: 44.8, threePct: 35.5, ftPct: 85.2, mpg: 36.2, tov: 3.5, gamesPlayed: 42 },
  "1630524": { name: "Keyonte George", team: "UTA", teamName: "Utah Jazz", position: "G", ppg: 25.2, rpg: 4.2, apg: 2.6, spg: 1.2, bpg: 0.2, fgPct: 42.5, threePct: 35.2, ftPct: 85.8, mpg: 34.5, tov: 3.2, gamesPlayed: 43 },
  "1641705": { name: "Victor Wembanyama", team: "SAS", teamName: "San Antonio Spurs", position: "C", ppg: 24.2, rpg: 10.8, apg: 4.0, spg: 0.9, bpg: 2.0, fgPct: 47.8, threePct: 34.5, ftPct: 80.2, mpg: 32.5, tov: 3.5, gamesPlayed: 51 },
  "1627783": { name: "Pascal Siakam", team: "IND", teamName: "Indiana Pacers", position: "F", ppg: 23.8, rpg: 6.9, apg: 4.9, spg: 0.9, bpg: 0.2, fgPct: 49.5, threePct: 33.5, ftPct: 78.5, mpg: 35.5, tov: 2.5, gamesPlayed: 48 },
  "1629636": { name: "Jalen Johnson", team: "ATL", teamName: "Atlanta Hawks", position: "F", ppg: 23.1, rpg: 3.6, apg: 1.8, spg: 0.5, bpg: 0.4, fgPct: 48.2, threePct: 33.2, ftPct: 75.8, mpg: 33.5, tov: 2.2, gamesPlayed: 46 },
  "1626181": { name: "Norman Powell", team: "MIA", teamName: "Miami Heat", position: "G", ppg: 23.0, rpg: 6.8, apg: 4.0, spg: 0.6, bpg: 0.3, fgPct: 47.8, threePct: 40.2, ftPct: 86.5, mpg: 34.2, tov: 2.0, gamesPlayed: 43 },
  "203944": { name: "Julius Randle", team: "MIN", teamName: "Minnesota Timberwolves", position: "F", ppg: 22.2, rpg: 10.5, apg: 5.4, spg: 0.6, bpg: 0.4, fgPct: 45.2, threePct: 35.5, ftPct: 78.2, mpg: 35.5, tov: 3.2, gamesPlayed: 47 },
  "1627742": { name: "Brandon Ingram", team: "TOR", teamName: "Toronto Raptors", position: "F", ppg: 21.9, rpg: 5.9, apg: 3.7, spg: 0.6, bpg: 0.4, fgPct: 47.5, threePct: 34.8, ftPct: 82.5, mpg: 34.8, tov: 2.5, gamesPlayed: 49 },
  "1630549": { name: "Shaedon Sharpe", team: "POR", teamName: "Portland Trail Blazers", position: "G", ppg: 21.8, rpg: 4.5, apg: 3.6, spg: 0.6, bpg: 0.3, fgPct: 45.8, threePct: 36.5, ftPct: 84.2, mpg: 32.5, tov: 2.5, gamesPlayed: 46 },
  // Legacy players still referenced
  "2544": { name: "LeBron James", team: "LAL", teamName: "Los Angeles Lakers", position: "F", ppg: 18.5, rpg: 6.2, apg: 7.5, spg: 0.7, bpg: 0.4, fgPct: 50.2, threePct: 37.5, ftPct: 74.2, mpg: 32.5, tov: 3.2, gamesPlayed: 35 },
  "1630194": { name: "Jalen Duren", team: "DET", teamName: "Detroit Pistons", position: "C", ppg: 14.5, rpg: 11.8, apg: 2.2, spg: 0.8, bpg: 1.2, fgPct: 62.5, threePct: 0.0, ftPct: 65.8, mpg: 30.5, tov: 2.0, gamesPlayed: 46 },
  "1630578": { name: "Alperen Sengun", team: "HOU", teamName: "Houston Rockets", position: "C", ppg: 20.3, rpg: 9.4, apg: 5.2, spg: 1.0, bpg: 0.8, fgPct: 55.2, threePct: 32.5, ftPct: 72.5, mpg: 33.5, tov: 3.2, gamesPlayed: 41 },
  "1628389": { name: "Bam Adebayo", team: "MIA", teamName: "Miami Heat", position: "C", ppg: 18.5, rpg: 8.8, apg: 4.5, spg: 1.2, bpg: 1.0, fgPct: 52.5, threePct: 28.5, ftPct: 78.5, mpg: 34.5, tov: 2.5, gamesPlayed: 41 },
  // Additional players
  "203552": { name: "Seth Curry", team: "CHA", teamName: "Charlotte Hornets", position: "G", ppg: 8.5, rpg: 1.8, apg: 2.2, spg: 0.5, bpg: 0.1, fgPct: 44.5, threePct: 40.2, ftPct: 90.5, mpg: 22.5, tov: 1.0, gamesPlayed: 35 },
  "203507": { name: "Giannis Antetokounmpo", team: "MIL", teamName: "Milwaukee Bucks", position: "F", ppg: 31.2, rpg: 11.5, apg: 6.5, spg: 1.2, bpg: 1.5, fgPct: 60.5, threePct: 27.5, ftPct: 65.8, mpg: 35.5, tov: 3.5, gamesPlayed: 48 },
  "203999": { name: "Nikola Jokic", team: "DEN", teamName: "Denver Nuggets", position: "C", ppg: 29.8, rpg: 13.2, apg: 9.5, spg: 1.5, bpg: 0.9, fgPct: 56.5, threePct: 38.2, ftPct: 82.5, mpg: 37.2, tov: 3.2, gamesPlayed: 50 },
  "203954": { name: "Joel Embiid", team: "PHI", teamName: "Philadelphia 76ers", position: "C", ppg: 27.5, rpg: 10.5, apg: 4.2, spg: 1.0, bpg: 1.8, fgPct: 52.8, threePct: 35.5, ftPct: 88.2, mpg: 33.5, tov: 3.5, gamesPlayed: 32 },
  "1628369": { name: "Jayson Tatum", team: "BOS", teamName: "Boston Celtics", position: "F", ppg: 28.5, rpg: 8.2, apg: 5.5, spg: 1.2, bpg: 0.6, fgPct: 47.2, threePct: 37.8, ftPct: 83.5, mpg: 36.5, tov: 2.8, gamesPlayed: 46 },
  "202710": { name: "Jimmy Butler", team: "MIA", teamName: "Miami Heat", position: "F", ppg: 19.5, rpg: 5.8, apg: 5.2, spg: 1.5, bpg: 0.4, fgPct: 49.5, threePct: 35.2, ftPct: 85.5, mpg: 33.5, tov: 2.2, gamesPlayed: 38 },
  "203081": { name: "Damian Lillard", team: "MIL", teamName: "Milwaukee Bucks", position: "G", ppg: 25.5, rpg: 4.5, apg: 7.2, spg: 1.0, bpg: 0.3, fgPct: 43.5, threePct: 35.8, ftPct: 91.5, mpg: 35.5, tov: 2.8, gamesPlayed: 45 },
  "1629027": { name: "Trae Young", team: "ATL", teamName: "Atlanta Hawks", position: "G", ppg: 24.8, rpg: 3.2, apg: 11.2, spg: 1.2, bpg: 0.1, fgPct: 42.5, threePct: 34.5, ftPct: 88.5, mpg: 35.2, tov: 4.2, gamesPlayed: 47 },
  "1629630": { name: "Ja Morant", team: "MEM", teamName: "Memphis Grizzlies", position: "G", ppg: 22.5, rpg: 5.2, apg: 8.5, spg: 1.0, bpg: 0.4, fgPct: 45.5, threePct: 32.5, ftPct: 78.5, mpg: 32.5, tov: 3.8, gamesPlayed: 35 },
  "1628368": { name: "De'Aaron Fox", team: "SAC", teamName: "Sacramento Kings", position: "G", ppg: 26.2, rpg: 4.8, apg: 6.5, spg: 1.5, bpg: 0.5, fgPct: 47.2, threePct: 33.5, ftPct: 75.5, mpg: 36.5, tov: 3.0, gamesPlayed: 48 },
  "1630169": { name: "Tyrese Haliburton", team: "IND", teamName: "Indiana Pacers", position: "G", ppg: 20.5, rpg: 3.5, apg: 9.5, spg: 1.2, bpg: 0.5, fgPct: 44.5, threePct: 38.5, ftPct: 85.5, mpg: 33.5, tov: 2.5, gamesPlayed: 42 },
  "1626157": { name: "Karl-Anthony Towns", team: "NYK", teamName: "New York Knicks", position: "C", ppg: 25.5, rpg: 11.2, apg: 3.2, spg: 0.8, bpg: 0.8, fgPct: 54.5, threePct: 42.5, ftPct: 82.5, mpg: 34.5, tov: 2.8, gamesPlayed: 46 },
  "202331": { name: "Paul George", team: "PHI", teamName: "Philadelphia 76ers", position: "F", ppg: 16.5, rpg: 5.5, apg: 5.2, spg: 1.5, bpg: 0.4, fgPct: 42.5, threePct: 35.5, ftPct: 88.5, mpg: 32.5, tov: 2.5, gamesPlayed: 38 },
  "1629627": { name: "Zion Williamson", team: "NOP", teamName: "New Orleans Pelicans", position: "F", ppg: 24.8, rpg: 7.2, apg: 5.5, spg: 1.2, bpg: 0.6, fgPct: 58.5, threePct: 32.5, ftPct: 72.5, mpg: 32.5, tov: 3.0, gamesPlayed: 35 },
  "202681": { name: "Kyrie Irving", team: "DAL", teamName: "Dallas Mavericks", position: "G", ppg: 24.2, rpg: 4.5, apg: 5.8, spg: 1.0, bpg: 0.4, fgPct: 48.5, threePct: 41.5, ftPct: 90.5, mpg: 35.5, tov: 2.5, gamesPlayed: 44 },
};

// Create a lookup map by player name for fallback searches
const TOP_PLAYERS_BY_NAME: Record<string, { id: string; data: typeof TOP_PLAYERS[keyof typeof TOP_PLAYERS] }> = {};
for (const [id, data] of Object.entries(TOP_PLAYERS)) {
  TOP_PLAYERS_BY_NAME[data.name.toLowerCase()] = { id, data };
}

interface PlayerSeasonStats {
  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
  fgPct: number;
  threePct: number;
  ftPct: number;
  mpg: number;
  tov: number;
  gamesPlayed: number;
}

// GET - Fetch player season averages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const playerName = searchParams.get("name");

    // First check if we have fallback data by ID
    let fallbackPlayer = TOP_PLAYERS[id];
    let resolvedId = id;

    // If not found by ID and we have a name, try to find by name
    if (!fallbackPlayer && playerName) {
      const nameMatch = TOP_PLAYERS_BY_NAME[playerName.toLowerCase()];
      if (nameMatch) {
        fallbackPlayer = nameMatch.data;
        resolvedId = nameMatch.id;
      }
    }

    if (fallbackPlayer) {
      return NextResponse.json({
        success: true,
        player: {
          id,
          name: fallbackPlayer.name,
          team: fallbackPlayer.teamName,
          teamAbbr: fallbackPlayer.team,
          position: fallbackPlayer.position,
        },
        stats: {
          ppg: fallbackPlayer.ppg,
          rpg: fallbackPlayer.rpg,
          apg: fallbackPlayer.apg,
          spg: fallbackPlayer.spg,
          bpg: fallbackPlayer.bpg,
          fgPct: fallbackPlayer.fgPct,
          threePct: fallbackPlayer.threePct,
          ftPct: fallbackPlayer.ftPct,
          mpg: fallbackPlayer.mpg,
          tov: fallbackPlayer.tov,
          gamesPlayed: fallbackPlayer.gamesPlayed,
        },
        source: "fallback",
      });
    }

    // Try to get from database
    let prisma;
    try {
      prisma = (await import("@/lib/db/prisma")).default;
    } catch {
      // If Prisma import fails, return empty stats
      return NextResponse.json({
        success: true,
        stats: {
          ppg: 0, rpg: 0, apg: 0, spg: 0, bpg: 0,
          fgPct: 0, threePct: 0, ftPct: 0, mpg: 0, tov: 0, gamesPlayed: 0,
        },
        source: "none",
      });
    }

    // Get player from database
    const player = await prisma.player.findUnique({
      where: { id },
      include: { team: true },
    });

    if (!player) {
      // Return empty stats for unknown players
      return NextResponse.json({
        success: true,
        stats: {
          ppg: 0, rpg: 0, apg: 0, spg: 0, bpg: 0,
          fgPct: 0, threePct: 0, ftPct: 0, mpg: 0, tov: 0, gamesPlayed: 0,
        },
        source: "none",
      });
    }

    // Get all player stats
    const stats = await prisma.playerStat.findMany({
      where: { playerId: id },
      orderBy: { game: { gameDate: "desc" } },
    });

    if (stats.length === 0) {
      // Return default stats if no game data
      return NextResponse.json({
        success: true,
        player: {
          id: player.id,
          name: player.name,
          team: player.team?.name || "Free Agent",
          teamAbbr: player.team?.abbreviation || "FA",
          position: player.position || "G",
        },
        stats: {
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
        },
        recentGames: [],
      });
    }

    // Calculate season averages
    const gamesPlayed = stats.length;
    const totals = stats.reduce(
      (acc, s) => ({
        points: acc.points + s.points,
        rebounds: acc.rebounds + s.rebounds,
        assists: acc.assists + s.assists,
        steals: acc.steals + s.steals,
        blocks: acc.blocks + s.blocks,
        turnovers: acc.turnovers + s.turnovers,
        minutes: acc.minutes + s.minutes,
        fgm: acc.fgm + s.fgm,
        fga: acc.fga + s.fga,
        tpm: acc.tpm + s.tpm,
        tpa: acc.tpa + s.tpa,
        ftm: acc.ftm + s.ftm,
        fta: acc.fta + s.fta,
      }),
      {
        points: 0,
        rebounds: 0,
        assists: 0,
        steals: 0,
        blocks: 0,
        turnovers: 0,
        minutes: 0,
        fgm: 0,
        fga: 0,
        tpm: 0,
        tpa: 0,
        ftm: 0,
        fta: 0,
      }
    );

    const seasonStats: PlayerSeasonStats = {
      ppg: Math.round((totals.points / gamesPlayed) * 10) / 10,
      rpg: Math.round((totals.rebounds / gamesPlayed) * 10) / 10,
      apg: Math.round((totals.assists / gamesPlayed) * 10) / 10,
      spg: Math.round((totals.steals / gamesPlayed) * 10) / 10,
      bpg: Math.round((totals.blocks / gamesPlayed) * 10) / 10,
      fgPct: totals.fga > 0 ? Math.round((totals.fgm / totals.fga) * 1000) / 10 : 0,
      threePct: totals.tpa > 0 ? Math.round((totals.tpm / totals.tpa) * 1000) / 10 : 0,
      ftPct: totals.fta > 0 ? Math.round((totals.ftm / totals.fta) * 1000) / 10 : 0,
      mpg: Math.round((totals.minutes / gamesPlayed) * 10) / 10,
      tov: Math.round((totals.turnovers / gamesPlayed) * 10) / 10,
      gamesPlayed,
    };

    // Get last 5 games
    const recentGames = stats.slice(0, 5).map((s) => ({
      points: s.points,
      rebounds: s.rebounds,
      assists: s.assists,
      steals: s.steals,
      blocks: s.blocks,
      minutes: s.minutes,
      fgm: s.fgm,
      fga: s.fga,
      tpm: s.tpm,
      tpa: s.tpa,
    }));

    return NextResponse.json({
      success: true,
      player: {
        id: player.id,
        name: player.name,
        team: player.team?.name || "Free Agent",
        teamAbbr: player.team?.abbreviation || "FA",
        position: player.position || "G",
        height: player.height,
        weight: player.weight,
        jerseyNum: player.jerseyNum,
      },
      stats: seasonStats,
      recentGames,
    });
  } catch (error) {
    console.error("Error fetching player stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch player stats" },
      { status: 500 }
    );
  }
}
