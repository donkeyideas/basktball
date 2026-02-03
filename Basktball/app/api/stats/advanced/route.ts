import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const sortBy = searchParams.get("sortBy") || "per";
    const order = searchParams.get("order") || "desc";

    // Get player stats aggregated by player
    const playerStats = await prisma.playerStat.groupBy({
      by: ["playerId"],
      _avg: {
        points: true,
        rebounds: true,
        assists: true,
        steals: true,
        blocks: true,
        turnovers: true,
        fgm: true,
        fga: true,
        tpm: true,
        tpa: true,
        ftm: true,
        fta: true,
        minutes: true,
      },
      _sum: {
        points: true,
        rebounds: true,
        assists: true,
        steals: true,
        blocks: true,
        turnovers: true,
        fgm: true,
        fga: true,
        tpm: true,
        tpa: true,
        ftm: true,
        fta: true,
        minutes: true,
      },
      _count: {
        id: true,
      },
    });

    // Filter to players with enough games and minutes
    const qualifiedStats = playerStats.filter(
      (s) => s._count.id >= 5 && (s._avg.minutes || 0) >= 10
    );

    // Fetch player details
    const playerIds = qualifiedStats.map((s) => s.playerId);
    const players = await prisma.player.findMany({
      where: { id: { in: playerIds } },
      include: {
        team: {
          select: { abbreviation: true, name: true },
        },
      },
    });

    // Calculate advanced stats for each player
    const advancedStats = qualifiedStats.map((stat) => {
      const player = players.find((p) => p.id === stat.playerId);

      // Basic averages
      const ppg = stat._avg.points || 0;
      const rpg = stat._avg.rebounds || 0;
      const apg = stat._avg.assists || 0;
      const spg = stat._avg.steals || 0;
      const bpg = stat._avg.blocks || 0;
      const tpg = stat._avg.turnovers || 0;
      const mpg = stat._avg.minutes || 1;

      const fgm = stat._avg.fgm || 0;
      const fga = stat._avg.fga || 1;
      const tpm = stat._avg.tpm || 0;
      const tpa = stat._avg.tpa || 1;
      const ftm = stat._avg.ftm || 0;
      const fta = stat._avg.fta || 1;

      // True Shooting % = PTS / (2 * (FGA + 0.44 * FTA))
      const tsa = fga + 0.44 * fta;
      const ts = tsa > 0 ? (ppg / (2 * tsa)) * 100 : 0;

      // Effective FG% = (FGM + 0.5 * 3PM) / FGA
      const efg = fga > 0 ? ((fgm + 0.5 * tpm) / fga) * 100 : 0;

      // Usage Rate estimate = (FGA + 0.44 * FTA + TOV) / (team possessions * %min)
      // Simplified: (FGA + 0.44 * FTA + TOV) * 40 / minutes
      const possessions = fga + 0.44 * fta + tpg;
      const usg = mpg > 0 ? (possessions / mpg) * 40 * 100 / 100 : 0;

      // PER (simplified John Hollinger formula approximation)
      // This is a simplified version
      const per = (
        ppg + rpg * 1.2 + apg * 1.5 + spg * 2 + bpg * 2 - tpg * 1.5 -
        (fga - fgm) * 0.5 - (fta - ftm) * 0.5
      ) * (15 / mpg);

      // Offensive Rating estimate (points produced per 100 possessions)
      const ortg = possessions > 0 ? (ppg / possessions) * 100 : 100;

      // Defensive Rating estimate (simplified - would need team data for accurate)
      const drtg = 100 + (tpg * 2) - (spg * 3) - (bpg * 2);

      // Box Plus/Minus estimate
      const bpm = (per - 15) / 3;

      // Value Over Replacement Player estimate
      const gamesPlayed = stat._count.id;
      const vorp = (bpm + 2) * (mpg / 48) * (gamesPlayed / 82) * 2.7;

      // Win Shares estimate (simplified)
      const ws = ((per - 10) / 20) * (mpg / 48) * gamesPlayed;

      return {
        playerId: stat.playerId,
        name: player?.name || "Unknown",
        team: player?.team?.abbreviation || "FA",
        position: player?.position || "-",
        gamesPlayed,
        mpg: Math.round(mpg * 10) / 10,
        ppg: Math.round(ppg * 10) / 10,
        rpg: Math.round(rpg * 10) / 10,
        apg: Math.round(apg * 10) / 10,
        per: Math.round(per * 10) / 10,
        ts: Math.round(ts * 10) / 10,
        efg: Math.round(efg * 10) / 10,
        usg: Math.round(usg * 10) / 10,
        ortg: Math.round(ortg),
        drtg: Math.round(drtg),
        bpm: Math.round(bpm * 10) / 10,
        vorp: Math.round(vorp * 10) / 10,
        ws: Math.round(ws * 10) / 10,
      };
    });

    // Sort by requested field
    const sortedStats = advancedStats.sort((a, b) => {
      const aVal = a[sortBy as keyof typeof a] || 0;
      const bVal = b[sortBy as keyof typeof b] || 0;
      if (typeof aVal === "number" && typeof bVal === "number") {
        return order === "desc" ? bVal - aVal : aVal - bVal;
      }
      return 0;
    });

    return NextResponse.json({
      success: true,
      players: sortedStats.slice(0, limit),
    });
  } catch (error) {
    console.error("Advanced stats API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch advanced stats" },
      { status: 500 }
    );
  }
}
