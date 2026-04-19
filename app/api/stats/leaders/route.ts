import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getLeagueLeaders } from "@/lib/api/live-stats";
import { statsCache } from "@/lib/cache/redis";

export const dynamic = "force-dynamic";

type StatCategory = "ppg" | "rpg" | "apg" | "spg" | "bpg" | "fg_pct" | "three_pct";

// NBA.com headshot URL helper
const getNbaHeadshot = (nbaId: string) =>
  `https://cdn.nba.com/headshots/nba/latest/1040x760/${nbaId}.png`;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = (searchParams.get("category") || "ppg") as StatCategory;
    const limit = parseInt(searchParams.get("limit") || "10");
    const flush = searchParams.get("flush") === "true";

    // Flush cache if requested (so code changes take effect immediately)
    if (flush) {
      await statsCache.delete(`live:leaders:${category}`);
    }

    // First try to get from database
    const playerStats = await prisma.playerStat.groupBy({
      by: ["playerId"],
      _avg: {
        points: true,
        rebounds: true,
        assists: true,
        steals: true,
        blocks: true,
        fgm: true,
        fga: true,
        tpm: true,
        tpa: true,
      },
      _count: {
        id: true,
      },
    });

    // Filter to players with enough games
    const qualifiedStats = playerStats.filter((s) => s._count.id >= 5);

    // If database has data, use it
    if (qualifiedStats.length > 0) {
      const sortedStats = qualifiedStats.sort((a, b) => {
        switch (category) {
          case "ppg":
            return (b._avg.points || 0) - (a._avg.points || 0);
          case "rpg":
            return (b._avg.rebounds || 0) - (a._avg.rebounds || 0);
          case "apg":
            return (b._avg.assists || 0) - (a._avg.assists || 0);
          case "spg":
            return (b._avg.steals || 0) - (a._avg.steals || 0);
          case "bpg":
            return (b._avg.blocks || 0) - (a._avg.blocks || 0);
          case "fg_pct":
            const aFgPct = a._avg.fga ? (a._avg.fgm || 0) / a._avg.fga : 0;
            const bFgPct = b._avg.fga ? (b._avg.fgm || 0) / b._avg.fga : 0;
            return bFgPct - aFgPct;
          case "three_pct":
            const a3Pct = a._avg.tpa ? (a._avg.tpm || 0) / a._avg.tpa : 0;
            const b3Pct = b._avg.tpa ? (b._avg.tpm || 0) / b._avg.tpa : 0;
            return b3Pct - a3Pct;
          default:
            return (b._avg.points || 0) - (a._avg.points || 0);
        }
      });

      const topPlayerIds = sortedStats.slice(0, limit).map((s) => s.playerId);
      const players = await prisma.player.findMany({
        where: { id: { in: topPlayerIds } },
        include: {
          team: {
            select: { abbreviation: true, name: true },
          },
        },
      });

      const leaders = sortedStats.slice(0, limit).map((stat, index) => {
        const player = players.find((p) => p.id === stat.playerId);
        let value: number;
        switch (category) {
          case "ppg":
            value = stat._avg.points || 0;
            break;
          case "rpg":
            value = stat._avg.rebounds || 0;
            break;
          case "apg":
            value = stat._avg.assists || 0;
            break;
          case "spg":
            value = stat._avg.steals || 0;
            break;
          case "bpg":
            value = stat._avg.blocks || 0;
            break;
          case "fg_pct":
            value = stat._avg.fga ? ((stat._avg.fgm || 0) / stat._avg.fga) * 100 : 0;
            break;
          case "three_pct":
            value = stat._avg.tpa ? ((stat._avg.tpm || 0) / stat._avg.tpa) * 100 : 0;
            break;
          default:
            value = stat._avg.points || 0;
        }

        return {
          rank: index + 1,
          playerId: stat.playerId,
          name: player?.name || "Unknown",
          team: player?.team?.abbreviation || "FA",
          teamName: player?.team?.name || "Free Agent",
          value: Math.round(value * 10) / 10,
          gamesPlayed: stat._count.id,
          imageUrl: player?.headshotUrl || getNbaHeadshot(stat.playerId),
        };
      });

      return NextResponse.json({
        success: true,
        category,
        leaders,
        source: "database",
      });
    }

    // Try live ESPN data when database is empty
    const liveLeaders = await getLeagueLeaders(category, limit);
    if (liveLeaders.length > 0) {
      const leaders = liveLeaders.map((leader, index) => ({
        rank: index + 1,
        ...leader,
      }));

      return NextResponse.json({
        success: true,
        category,
        leaders,
        source: "espn_live",
      });
    }

    // Last resort: return empty with message
    return NextResponse.json({
      success: true,
      category,
      leaders: [],
      source: "unavailable",
      message: "Stats data is currently being loaded. Please check back shortly.",
    });
  } catch (error) {
    console.error("Stats leaders API error:", error);

    // Try live data even on error
    try {
      const category = "ppg" as StatCategory;
      const liveLeaders = await getLeagueLeaders(category, 10);
      if (liveLeaders.length > 0) {
        return NextResponse.json({
          success: true,
          category,
          leaders: liveLeaders.map((l, i) => ({ rank: i + 1, ...l })),
          source: "espn_live",
        });
      }
    } catch {
      // Both failed
    }

    return NextResponse.json({
      success: true,
      category: "ppg",
      leaders: [],
      source: "unavailable",
    });
  }
}
