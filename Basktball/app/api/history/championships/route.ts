import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

interface ChampionshipCount {
  team: string;
  count: number;
  lastWon: string;
}

// GET - Fetch championship counts
export async function GET() {
  try {
    // Try to derive from season history
    const seasons = await prisma.seasonHistory.findMany({
      select: { champion: true, year: true },
      orderBy: { year: "desc" },
    });

    if (seasons.length > 0) {
      // Count championships by team
      const counts: Record<string, { count: number; lastWon: string }> = {};

      for (const season of seasons) {
        if (!counts[season.champion]) {
          counts[season.champion] = { count: 0, lastWon: season.year };
        }
        counts[season.champion].count++;
      }

      const championships: ChampionshipCount[] = Object.entries(counts)
        .map(([team, data]) => ({
          team,
          count: data.count,
          lastWon: data.lastWon,
        }))
        .sort((a, b) => b.count - a.count);

      return NextResponse.json({
        success: true,
        championships,
        source: "database",
      });
    }

    // Return fallback data
    return NextResponse.json({
      success: true,
      championships: getFallbackChampionships(),
      source: "fallback",
    });
  } catch (error) {
    console.error("Error fetching championship counts:", error);
    return NextResponse.json({
      success: true,
      championships: getFallbackChampionships(),
      source: "fallback",
    });
  }
}

function getFallbackChampionships(): ChampionshipCount[] {
  return [
    { team: "Boston Celtics", count: 18, lastWon: "2024" },
    { team: "Los Angeles Lakers", count: 17, lastWon: "2020" },
    { team: "Golden State Warriors", count: 7, lastWon: "2022" },
    { team: "Chicago Bulls", count: 6, lastWon: "1998" },
    { team: "San Antonio Spurs", count: 5, lastWon: "2014" },
    { team: "Miami Heat", count: 3, lastWon: "2013" },
    { team: "Detroit Pistons", count: 3, lastWon: "2004" },
    { team: "Philadelphia 76ers", count: 3, lastWon: "1983" },
    { team: "Oklahoma City Thunder", count: 1, lastWon: "2025" },
  ];
}
