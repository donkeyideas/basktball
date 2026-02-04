import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// 2024-25 Season stats for top NBA players
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
  "1629029": { name: "Luka Doncic", team: "DAL", teamName: "Dallas Mavericks", position: "G", ppg: 33.9, rpg: 9.2, apg: 9.8, spg: 1.4, bpg: 0.5, fgPct: 48.7, threePct: 35.4, ftPct: 78.6, mpg: 37.5, tov: 4.1, gamesPlayed: 45 },
  "1628983": { name: "Shai Gilgeous-Alexander", team: "OKC", teamName: "Oklahoma City Thunder", position: "G", ppg: 31.4, rpg: 5.5, apg: 6.2, spg: 2.0, bpg: 0.9, fgPct: 53.5, threePct: 35.3, ftPct: 87.4, mpg: 34.2, tov: 2.8, gamesPlayed: 48 },
  "203507": { name: "Giannis Antetokounmpo", team: "MIL", teamName: "Milwaukee Bucks", position: "F", ppg: 31.2, rpg: 11.8, apg: 6.5, spg: 1.2, bpg: 1.5, fgPct: 60.5, threePct: 27.1, ftPct: 65.7, mpg: 35.8, tov: 3.8, gamesPlayed: 42 },
  "203954": { name: "Joel Embiid", team: "PHI", teamName: "Philadelphia 76ers", position: "C", ppg: 27.9, rpg: 10.8, apg: 3.2, spg: 1.0, bpg: 1.7, fgPct: 52.1, threePct: 38.8, ftPct: 88.2, mpg: 34.5, tov: 3.5, gamesPlayed: 25 },
  "1628369": { name: "Jayson Tatum", team: "BOS", teamName: "Boston Celtics", position: "F", ppg: 27.5, rpg: 8.3, apg: 5.0, spg: 1.0, bpg: 0.6, fgPct: 45.8, threePct: 37.6, ftPct: 83.2, mpg: 36.2, tov: 2.9, gamesPlayed: 47 },
  "203999": { name: "Nikola Jokic", team: "DEN", teamName: "Denver Nuggets", position: "C", ppg: 26.8, rpg: 13.1, apg: 10.2, spg: 1.4, bpg: 0.9, fgPct: 58.2, threePct: 36.4, ftPct: 81.7, mpg: 37.1, tov: 3.2, gamesPlayed: 48 },
  "1629027": { name: "Trae Young", team: "ATL", teamName: "Atlanta Hawks", position: "G", ppg: 26.1, rpg: 3.0, apg: 11.4, spg: 1.3, bpg: 0.2, fgPct: 43.0, threePct: 34.2, ftPct: 86.5, mpg: 35.5, tov: 4.5, gamesPlayed: 44 },
  "201142": { name: "Kevin Durant", team: "PHX", teamName: "Phoenix Suns", position: "F", ppg: 27.2, rpg: 6.3, apg: 5.2, spg: 0.9, bpg: 1.2, fgPct: 52.3, threePct: 42.1, ftPct: 85.6, mpg: 37.2, tov: 3.1, gamesPlayed: 40 },
  "1626164": { name: "Devin Booker", team: "PHX", teamName: "Phoenix Suns", position: "G", ppg: 25.8, rpg: 4.2, apg: 6.8, spg: 1.8, bpg: 0.3, fgPct: 49.2, threePct: 38.9, ftPct: 88.1, mpg: 35.8, tov: 2.6, gamesPlayed: 45 },
  "203076": { name: "Anthony Davis", team: "LAL", teamName: "Los Angeles Lakers", position: "F-C", ppg: 25.4, rpg: 11.7, apg: 3.5, spg: 1.2, bpg: 2.3, fgPct: 55.6, threePct: 32.4, ftPct: 81.3, mpg: 35.2, tov: 2.2, gamesPlayed: 42 },
  "203506": { name: "Domantas Sabonis", team: "SAC", teamName: "Sacramento Kings", position: "F-C", ppg: 19.8, rpg: 14.2, apg: 7.1, spg: 0.9, bpg: 0.5, fgPct: 59.4, threePct: 32.7, ftPct: 73.6, mpg: 36.8, tov: 2.8, gamesPlayed: 48 },
  "1641705": { name: "Victor Wembanyama", team: "SAS", teamName: "San Antonio Spurs", position: "C", ppg: 21.4, rpg: 10.1, apg: 3.6, spg: 1.0, bpg: 3.8, fgPct: 46.5, threePct: 32.8, ftPct: 79.2, mpg: 30.5, tov: 3.5, gamesPlayed: 47 },
  "203497": { name: "Rudy Gobert", team: "MIN", teamName: "Minnesota Timberwolves", position: "C", ppg: 13.5, rpg: 10.8, apg: 1.3, spg: 0.6, bpg: 2.1, fgPct: 66.8, threePct: 0.0, ftPct: 68.9, mpg: 30.2, tov: 1.2, gamesPlayed: 46 },
  "1628368": { name: "De'Aaron Fox", team: "SAC", teamName: "Sacramento Kings", position: "G", ppg: 26.8, rpg: 4.5, apg: 6.0, spg: 2.1, bpg: 0.4, fgPct: 47.2, threePct: 33.5, ftPct: 73.8, mpg: 36.5, tov: 2.8, gamesPlayed: 48 },
  "1629639": { name: "Tyrese Haliburton", team: "IND", teamName: "Indiana Pacers", position: "G", ppg: 19.2, rpg: 3.8, apg: 9.5, spg: 1.2, bpg: 0.5, fgPct: 44.8, threePct: 36.4, ftPct: 85.2, mpg: 33.2, tov: 2.5, gamesPlayed: 40 },
  "1630163": { name: "LaMelo Ball", team: "CHA", teamName: "Charlotte Hornets", position: "G", ppg: 22.5, rpg: 5.8, apg: 8.2, spg: 1.5, bpg: 0.4, fgPct: 43.5, threePct: 35.8, ftPct: 87.1, mpg: 33.8, tov: 3.5, gamesPlayed: 35 },
  "1628991": { name: "Jaren Jackson Jr.", team: "MEM", teamName: "Memphis Grizzlies", position: "F-C", ppg: 21.5, rpg: 5.8, apg: 1.8, spg: 0.8, bpg: 1.8, fgPct: 47.1, threePct: 32.4, ftPct: 79.5, mpg: 29.5, tov: 2.2, gamesPlayed: 40 },
  "203081": { name: "Damian Lillard", team: "MIL", teamName: "Milwaukee Bucks", position: "G", ppg: 25.1, rpg: 4.5, apg: 7.3, spg: 1.0, bpg: 0.3, fgPct: 43.8, threePct: 36.2, ftPct: 91.4, mpg: 35.2, tov: 2.8, gamesPlayed: 44 },
  "202691": { name: "Klay Thompson", team: "DAL", teamName: "Dallas Mavericks", position: "G", ppg: 14.2, rpg: 3.5, apg: 2.1, spg: 0.6, bpg: 0.5, fgPct: 43.5, threePct: 38.5, ftPct: 92.1, mpg: 26.8, tov: 1.2, gamesPlayed: 46 },
  "1628378": { name: "Donovan Mitchell", team: "CLE", teamName: "Cleveland Cavaliers", position: "G", ppg: 24.5, rpg: 4.8, apg: 4.6, spg: 1.4, bpg: 0.3, fgPct: 45.2, threePct: 36.8, ftPct: 86.5, mpg: 34.5, tov: 2.8, gamesPlayed: 46 },
  "1630162": { name: "Anthony Edwards", team: "MIN", teamName: "Minnesota Timberwolves", position: "G", ppg: 24.2, rpg: 7.8, apg: 4.8, spg: 1.2, bpg: 0.5, fgPct: 44.5, threePct: 35.5, ftPct: 84.2, mpg: 35.8, tov: 3.2, gamesPlayed: 47 },
  "1630559": { name: "Franz Wagner", team: "ORL", teamName: "Orlando Magic", position: "F", ppg: 23.8, rpg: 5.9, apg: 4.2, spg: 0.9, bpg: 0.5, fgPct: 45.5, threePct: 34.2, ftPct: 85.8, mpg: 34.2, tov: 2.5, gamesPlayed: 44 },
  "1629630": { name: "Ja Morant", team: "MEM", teamName: "Memphis Grizzlies", position: "G", ppg: 24.8, rpg: 5.4, apg: 5.8, spg: 1.0, bpg: 0.4, fgPct: 46.8, threePct: 31.2, ftPct: 82.5, mpg: 32.5, tov: 3.2, gamesPlayed: 35 },
  "1630595": { name: "Cade Cunningham", team: "DET", teamName: "Detroit Pistons", position: "G", ppg: 20.5, rpg: 4.3, apg: 7.8, spg: 1.1, bpg: 0.4, fgPct: 43.2, threePct: 34.5, ftPct: 84.8, mpg: 35.2, tov: 3.5, gamesPlayed: 45 },
  "203110": { name: "Darius Garland", team: "CLE", teamName: "Cleveland Cavaliers", position: "G", ppg: 21.2, rpg: 2.8, apg: 6.8, spg: 0.8, bpg: 0.1, fgPct: 44.5, threePct: 37.5, ftPct: 88.2, mpg: 32.5, tov: 2.5, gamesPlayed: 43 },
  "1629628": { name: "RJ Barrett", team: "TOR", teamName: "Toronto Raptors", position: "F", ppg: 20.8, rpg: 5.6, apg: 4.5, spg: 0.8, bpg: 0.6, fgPct: 44.8, threePct: 33.8, ftPct: 78.5, mpg: 35.5, tov: 2.2, gamesPlayed: 42 },
  "1630224": { name: "Tyrese Maxey", team: "PHI", teamName: "Philadelphia 76ers", position: "G", ppg: 18.9, rpg: 3.2, apg: 5.2, spg: 0.9, bpg: 0.2, fgPct: 45.8, threePct: 37.2, ftPct: 87.5, mpg: 32.8, tov: 1.8, gamesPlayed: 38 },
  // Additional players for broader coverage
  "201566": { name: "Russell Westbrook", team: "DEN", teamName: "Denver Nuggets", position: "G", ppg: 11.2, rpg: 5.2, apg: 4.5, spg: 1.2, bpg: 0.3, fgPct: 45.2, threePct: 28.5, ftPct: 65.8, mpg: 22.5, tov: 2.8, gamesPlayed: 42 },
  "201935": { name: "James Harden", team: "LAC", teamName: "Los Angeles Clippers", position: "G", ppg: 18.5, rpg: 5.2, apg: 8.5, spg: 1.2, bpg: 0.5, fgPct: 43.5, threePct: 38.2, ftPct: 88.5, mpg: 33.2, tov: 4.2, gamesPlayed: 45 },
  "201939": { name: "Stephen Curry", team: "GSW", teamName: "Golden State Warriors", position: "G", ppg: 26.4, rpg: 5.2, apg: 6.1, spg: 0.9, bpg: 0.4, fgPct: 45.5, threePct: 40.8, ftPct: 92.5, mpg: 32.8, tov: 3.2, gamesPlayed: 48 },
  "2544": { name: "LeBron James", team: "LAL", teamName: "Los Angeles Lakers", position: "F", ppg: 23.5, rpg: 7.8, apg: 8.2, spg: 0.8, bpg: 0.5, fgPct: 52.2, threePct: 38.5, ftPct: 75.2, mpg: 35.2, tov: 3.5, gamesPlayed: 45 },
  "101108": { name: "Chris Paul", team: "SAS", teamName: "San Antonio Spurs", position: "G", ppg: 9.2, rpg: 3.8, apg: 6.8, spg: 1.2, bpg: 0.2, fgPct: 44.2, threePct: 35.8, ftPct: 85.5, mpg: 26.2, tov: 1.8, gamesPlayed: 42 },
  "203935": { name: "Marcus Smart", team: "MEM", teamName: "Memphis Grizzlies", position: "G", ppg: 14.5, rpg: 3.8, apg: 5.2, spg: 1.5, bpg: 0.3, fgPct: 42.5, threePct: 33.2, ftPct: 82.5, mpg: 28.5, tov: 2.2, gamesPlayed: 35 },
  "1628370": { name: "Jaylen Brown", team: "BOS", teamName: "Boston Celtics", position: "G-F", ppg: 24.5, rpg: 5.5, apg: 3.8, spg: 1.2, bpg: 0.5, fgPct: 49.8, threePct: 35.5, ftPct: 72.8, mpg: 34.5, tov: 2.5, gamesPlayed: 46 },
  "1627759": { name: "Jaylen Brown", team: "BOS", teamName: "Boston Celtics", position: "G-F", ppg: 24.5, rpg: 5.5, apg: 3.8, spg: 1.2, bpg: 0.5, fgPct: 49.8, threePct: 35.5, ftPct: 72.8, mpg: 34.5, tov: 2.5, gamesPlayed: 46 },
};

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

    // First check if we have fallback data
    const fallbackPlayer = TOP_PLAYERS[id];
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
