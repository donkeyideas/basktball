import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

    // Get player
    const player = await prisma.player.findUnique({
      where: { id },
      include: { team: true },
    });

    if (!player) {
      return NextResponse.json(
        { success: false, error: "Player not found" },
        { status: 404 }
      );
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
