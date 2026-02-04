import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

// GET - Fetch season history for public display
export async function GET() {
  try {
    const seasons = await prisma.seasonHistory.findMany({
      orderBy: { year: "desc" },
    });

    if (seasons.length === 0) {
      return NextResponse.json({
        success: true,
        seasons: getFallbackSeasons(),
        source: "fallback",
      });
    }

    return NextResponse.json({
      success: true,
      seasons,
      source: "database",
    });
  } catch (error) {
    console.error("Error fetching season history:", error);
    return NextResponse.json({
      success: true,
      seasons: getFallbackSeasons(),
      source: "fallback",
    });
  }
}

function getFallbackSeasons() {
  return [
    { id: "1", year: "2023-24", champion: "Boston Celtics", mvp: "Nikola Jokic", finalsScore: "4-1 vs Dallas", topScorer: "Luka Doncic", topScorerPpg: 33.9 },
    { id: "2", year: "2022-23", champion: "Denver Nuggets", mvp: "Joel Embiid", finalsScore: "4-1 vs Miami", topScorer: "Joel Embiid", topScorerPpg: 33.1 },
    { id: "3", year: "2021-22", champion: "Golden State Warriors", mvp: "Nikola Jokic", finalsScore: "4-2 vs Boston", topScorer: "Joel Embiid", topScorerPpg: 30.6 },
    { id: "4", year: "2020-21", champion: "Milwaukee Bucks", mvp: "Nikola Jokic", finalsScore: "4-2 vs Phoenix", topScorer: "Stephen Curry", topScorerPpg: 32.0 },
    { id: "5", year: "2019-20", champion: "Los Angeles Lakers", mvp: "Giannis Antetokounmpo", finalsScore: "4-2 vs Miami", topScorer: "James Harden", topScorerPpg: 34.3 },
  ];
}
