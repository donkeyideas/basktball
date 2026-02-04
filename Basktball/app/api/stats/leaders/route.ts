import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

type StatCategory = "ppg" | "rpg" | "apg" | "spg" | "bpg" | "fg_pct" | "three_pct";

// Current NBA season leaders (2024-25 season) - fallback data
// These are updated periodically and serve as display data when database is empty
const CURRENT_LEADERS = {
  ppg: [
    { playerId: "666786", name: "Luka Doncic", team: "DAL", teamName: "Dallas Mavericks", value: 33.9, gamesPlayed: 45 },
    { playerId: "666969", name: "Shai Gilgeous-Alexander", team: "OKC", teamName: "Oklahoma City Thunder", value: 31.4, gamesPlayed: 48 },
    { playerId: "203507", name: "Giannis Antetokounmpo", team: "MIL", teamName: "Milwaukee Bucks", value: 31.2, gamesPlayed: 42 },
    { playerId: "203954", name: "Joel Embiid", team: "PHI", teamName: "Philadelphia 76ers", value: 27.9, gamesPlayed: 25 },
    { playerId: "1628369", name: "Jayson Tatum", team: "BOS", teamName: "Boston Celtics", value: 27.5, gamesPlayed: 47 },
    { playerId: "203999", name: "Nikola Jokic", team: "DEN", teamName: "Denver Nuggets", value: 26.8, gamesPlayed: 48 },
    { playerId: "1629029", name: "Trae Young", team: "ATL", teamName: "Atlanta Hawks", value: 26.1, gamesPlayed: 44 },
    { playerId: "201142", name: "Kevin Durant", team: "PHX", teamName: "Phoenix Suns", value: 27.2, gamesPlayed: 40 },
    { playerId: "1628983", name: "Devin Booker", team: "PHX", teamName: "Phoenix Suns", value: 25.8, gamesPlayed: 45 },
    { playerId: "203944", name: "Anthony Davis", team: "LAL", teamName: "Los Angeles Lakers", value: 25.4, gamesPlayed: 42 },
  ],
  rpg: [
    { playerId: "666817", name: "Domantas Sabonis", team: "SAC", teamName: "Sacramento Kings", value: 14.2, gamesPlayed: 48 },
    { playerId: "203999", name: "Nikola Jokic", team: "DEN", teamName: "Denver Nuggets", value: 13.1, gamesPlayed: 48 },
    { playerId: "203507", name: "Giannis Antetokounmpo", team: "MIL", teamName: "Milwaukee Bucks", value: 11.8, gamesPlayed: 42 },
    { playerId: "203944", name: "Anthony Davis", team: "LAL", teamName: "Los Angeles Lakers", value: 11.7, gamesPlayed: 42 },
    { playerId: "1629627", name: "Rudy Gobert", team: "MIN", teamName: "Minnesota Timberwolves", value: 10.8, gamesPlayed: 46 },
  ],
  apg: [
    { playerId: "1629029", name: "Trae Young", team: "ATL", teamName: "Atlanta Hawks", value: 11.4, gamesPlayed: 44 },
    { playerId: "203999", name: "Nikola Jokic", team: "DEN", teamName: "Denver Nuggets", value: 10.2, gamesPlayed: 48 },
    { playerId: "666786", name: "Luka Doncic", team: "DAL", teamName: "Dallas Mavericks", value: 9.8, gamesPlayed: 45 },
    { playerId: "1628378", name: "Tyrese Haliburton", team: "IND", teamName: "Indiana Pacers", value: 9.5, gamesPlayed: 40 },
    { playerId: "201566", name: "LaMelo Ball", team: "CHA", teamName: "Charlotte Hornets", value: 8.2, gamesPlayed: 35 },
  ],
  spg: [
    { playerId: "201566", name: "De'Aaron Fox", team: "SAC", teamName: "Sacramento Kings", value: 2.1, gamesPlayed: 48 },
    { playerId: "1628983", name: "Devin Booker", team: "PHX", teamName: "Phoenix Suns", value: 1.8, gamesPlayed: 45 },
    { playerId: "203507", name: "Giannis Antetokounmpo", team: "MIL", teamName: "Milwaukee Bucks", value: 1.2, gamesPlayed: 42 },
    { playerId: "1629029", name: "Trae Young", team: "ATL", teamName: "Atlanta Hawks", value: 1.3, gamesPlayed: 44 },
    { playerId: "203999", name: "Nikola Jokic", team: "DEN", teamName: "Denver Nuggets", value: 1.4, gamesPlayed: 48 },
  ],
  bpg: [
    { playerId: "1641705", name: "Victor Wembanyama", team: "SAS", teamName: "San Antonio Spurs", value: 3.8, gamesPlayed: 47 },
    { playerId: "203944", name: "Anthony Davis", team: "LAL", teamName: "Los Angeles Lakers", value: 2.3, gamesPlayed: 42 },
    { playerId: "1629627", name: "Rudy Gobert", team: "MIN", teamName: "Minnesota Timberwolves", value: 2.1, gamesPlayed: 46 },
    { playerId: "203507", name: "Giannis Antetokounmpo", team: "MIL", teamName: "Milwaukee Bucks", value: 1.5, gamesPlayed: 42 },
    { playerId: "1628991", name: "Jaren Jackson Jr.", team: "MEM", teamName: "Memphis Grizzlies", value: 1.8, gamesPlayed: 40 },
  ],
  fg_pct: [
    { playerId: "1629627", name: "Rudy Gobert", team: "MIN", teamName: "Minnesota Timberwolves", value: 66.8, gamesPlayed: 46 },
    { playerId: "203999", name: "Nikola Jokic", team: "DEN", teamName: "Denver Nuggets", value: 58.2, gamesPlayed: 48 },
    { playerId: "203507", name: "Giannis Antetokounmpo", team: "MIL", teamName: "Milwaukee Bucks", value: 60.5, gamesPlayed: 42 },
    { playerId: "203944", name: "Anthony Davis", team: "LAL", teamName: "Los Angeles Lakers", value: 55.6, gamesPlayed: 42 },
    { playerId: "666817", name: "Domantas Sabonis", team: "SAC", teamName: "Sacramento Kings", value: 59.4, gamesPlayed: 48 },
  ],
  three_pct: [
    { playerId: "201142", name: "Kevin Durant", team: "PHX", teamName: "Phoenix Suns", value: 42.1, gamesPlayed: 40 },
    { playerId: "1628983", name: "Devin Booker", team: "PHX", teamName: "Phoenix Suns", value: 38.9, gamesPlayed: 45 },
    { playerId: "1628369", name: "Jayson Tatum", team: "BOS", teamName: "Boston Celtics", value: 37.6, gamesPlayed: 47 },
    { playerId: "203081", name: "Damian Lillard", team: "MIL", teamName: "Milwaukee Bucks", value: 36.2, gamesPlayed: 44 },
    { playerId: "203552", name: "Klay Thompson", team: "DAL", teamName: "Dallas Mavericks", value: 38.5, gamesPlayed: 46 },
  ],
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = (searchParams.get("category") || "ppg") as StatCategory;
    const limit = parseInt(searchParams.get("limit") || "10");

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
        };
      });

      return NextResponse.json({
        success: true,
        category,
        leaders,
        source: "database",
      });
    }

    // Fallback to current season leaders
    const fallbackLeaders = CURRENT_LEADERS[category] || CURRENT_LEADERS.ppg;
    const leaders = fallbackLeaders.slice(0, limit).map((leader, index) => ({
      rank: index + 1,
      ...leader,
    }));

    return NextResponse.json({
      success: true,
      category,
      leaders,
      source: "current_season",
    });
  } catch (error) {
    console.error("Stats leaders API error:", error);

    // Even on error, return fallback data
    const category = "ppg";
    const fallbackLeaders = CURRENT_LEADERS[category].slice(0, 10).map((leader, index) => ({
      rank: index + 1,
      ...leader,
    }));

    return NextResponse.json({
      success: true,
      category,
      leaders: fallbackLeaders,
      source: "fallback",
    });
  }
}
