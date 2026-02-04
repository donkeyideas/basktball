import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { deepseek } from "@/lib/ai";

interface FantasyPlayer {
  id: string;
  name: string;
  position: string;
  team: string;
  salary: number;
  projectedPts: number;
  value: number;
  status: "healthy" | "questionable" | "out";
}

// GET - Fetch fantasy players with AI-generated projections
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");

    // Get players with their recent stats
    const players = await prisma.player.findMany({
      where: {
        isActive: true,
        team: { isNot: null },
      },
      include: {
        team: true,
        stats: {
          orderBy: { game: { gameDate: "desc" } },
          take: 10,
          include: {
            game: true,
          },
        },
      },
      take: limit,
    });

    // Calculate fantasy projections based on stats
    const fantasyPlayers: FantasyPlayer[] = players.map((player) => {
      const recentStats = player.stats;

      // Calculate averages from recent games
      let avgPts = 0, avgReb = 0, avgAst = 0, avgStl = 0, avgBlk = 0, avgTov = 0;

      if (recentStats.length > 0) {
        avgPts = recentStats.reduce((sum, s) => sum + s.points, 0) / recentStats.length;
        avgReb = recentStats.reduce((sum, s) => sum + s.rebounds, 0) / recentStats.length;
        avgAst = recentStats.reduce((sum, s) => sum + s.assists, 0) / recentStats.length;
        avgStl = recentStats.reduce((sum, s) => sum + s.steals, 0) / recentStats.length;
        avgBlk = recentStats.reduce((sum, s) => sum + s.blocks, 0) / recentStats.length;
        avgTov = recentStats.reduce((sum, s) => sum + s.turnovers, 0) / recentStats.length;
      }

      // DraftKings-style fantasy points calculation
      // PTS: 1, REB: 1.25, AST: 1.5, STL: 2, BLK: 2, TOV: -0.5
      // Double-Double: 1.5, Triple-Double: 3
      const projectedPts = (
        avgPts * 1 +
        avgReb * 1.25 +
        avgAst * 1.5 +
        avgStl * 2 +
        avgBlk * 2 -
        avgTov * 0.5
      );

      // Salary calculation based on projected points (rough formula)
      const baseSalary = 3000;
      const salaryPerPoint = 150;
      const salary = Math.round((baseSalary + projectedPts * salaryPerPoint) / 100) * 100;

      // Value = projected points per $1000
      const value = salary > 0 ? (projectedPts / (salary / 1000)) : 0;

      // Determine status based on recent game activity
      let status: "healthy" | "questionable" | "out" = "healthy";
      if (recentStats.length === 0) {
        status = "out";
      } else if (recentStats.length < 3) {
        status = "questionable";
      }

      return {
        id: player.id,
        name: player.name,
        position: player.position || "G",
        team: player.team?.abbreviation || "FA",
        salary: Math.max(3000, Math.min(12000, salary)),
        projectedPts: Math.round(projectedPts * 10) / 10,
        value: Math.round(value * 100) / 100,
        status,
      };
    });

    // Sort by value
    fantasyPlayers.sort((a, b) => b.value - a.value);

    return NextResponse.json({
      success: true,
      players: fantasyPlayers,
      salaryCap: 50000,
    });
  } catch (error) {
    console.error("Error fetching fantasy players:", error);

    // Return fallback data if database fails
    const fallbackPlayers: FantasyPlayer[] = [
      { id: "1", name: "LeBron James", position: "SF", team: "LAL", salary: 10500, projectedPts: 52.3, value: 4.98, status: "healthy" },
      { id: "2", name: "Stephen Curry", position: "PG", team: "GSW", salary: 10200, projectedPts: 49.8, value: 4.88, status: "healthy" },
      { id: "3", name: "Giannis Antetokounmpo", position: "PF", team: "MIL", salary: 11000, projectedPts: 55.2, value: 5.02, status: "healthy" },
      { id: "4", name: "Kevin Durant", position: "SF", team: "PHX", salary: 10300, projectedPts: 48.5, value: 4.71, status: "questionable" },
      { id: "5", name: "Nikola Jokic", position: "C", team: "DEN", salary: 11200, projectedPts: 58.1, value: 5.19, status: "healthy" },
      { id: "6", name: "Jayson Tatum", position: "SF", team: "BOS", salary: 9800, projectedPts: 46.2, value: 4.71, status: "healthy" },
      { id: "7", name: "Luka Doncic", position: "PG", team: "DAL", salary: 10800, projectedPts: 54.5, value: 5.05, status: "healthy" },
      { id: "8", name: "Joel Embiid", position: "C", team: "PHI", salary: 10900, projectedPts: 51.8, value: 4.75, status: "out" },
      { id: "9", name: "Damian Lillard", position: "PG", team: "MIL", salary: 9200, projectedPts: 42.5, value: 4.62, status: "healthy" },
      { id: "10", name: "Anthony Davis", position: "PF", team: "LAL", salary: 9500, projectedPts: 44.8, value: 4.72, status: "healthy" },
      { id: "11", name: "Ja Morant", position: "PG", team: "MEM", salary: 8800, projectedPts: 40.2, value: 4.57, status: "healthy" },
      { id: "12", name: "Devin Booker", position: "SG", team: "PHX", salary: 8600, projectedPts: 38.5, value: 4.48, status: "healthy" },
      { id: "13", name: "Trae Young", position: "PG", team: "ATL", salary: 8400, projectedPts: 41.2, value: 4.90, status: "healthy" },
      { id: "14", name: "Donovan Mitchell", position: "SG", team: "CLE", salary: 8200, projectedPts: 37.8, value: 4.61, status: "healthy" },
      { id: "15", name: "Bam Adebayo", position: "C", team: "MIA", salary: 7800, projectedPts: 35.5, value: 4.55, status: "healthy" },
    ];

    return NextResponse.json({
      success: true,
      players: fallbackPlayers,
      salaryCap: 50000,
      fallback: true,
    });
  }
}
