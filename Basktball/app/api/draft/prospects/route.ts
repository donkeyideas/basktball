import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

// GET - Fetch draft prospects for public display
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get("year") || new Date().getFullYear().toString();

    const prospects = await prisma.draftProspect.findMany({
      where: {
        draftYear: parseInt(year),
      },
      orderBy: { rank: "asc" },
    });

    if (prospects.length === 0) {
      // Return fallback data
      return NextResponse.json({
        success: true,
        prospects: getFallbackProspects(),
        year: parseInt(year),
        source: "fallback",
      });
    }

    return NextResponse.json({
      success: true,
      prospects,
      year: parseInt(year),
      source: "database",
    });
  } catch (error) {
    console.error("Error fetching draft prospects:", error);
    return NextResponse.json({
      success: true,
      prospects: getFallbackProspects(),
      year: new Date().getFullYear(),
      source: "fallback",
    });
  }
}

function getFallbackProspects() {
  return [
    {
      id: "1",
      rank: 1,
      name: "Cooper Flagg",
      position: "SF/PF",
      school: "Duke",
      height: "6'9\"",
      weight: 205,
      age: 18,
      ppg: 18.5,
      rpg: 8.2,
      apg: 3.8,
      fgPct: 47.2,
      threePct: 35.5,
      strengths: ["Two-way impact", "Versatility", "Basketball IQ", "Motor"],
      weaknesses: ["Three-point consistency", "Needs to add strength"],
      comparison: "Jayson Tatum",
      projectedPick: "1-2",
      draftYear: 2025,
    },
    {
      id: "2",
      rank: 2,
      name: "Ace Bailey",
      position: "SF",
      school: "Rutgers",
      height: "6'9\"",
      weight: 195,
      age: 19,
      ppg: 17.8,
      rpg: 7.5,
      apg: 2.2,
      fgPct: 45.8,
      threePct: 38.2,
      strengths: ["Scoring versatility", "Length", "Shot creation"],
      weaknesses: ["Playmaking", "Defensive consistency"],
      comparison: "Brandon Ingram",
      projectedPick: "1-3",
      draftYear: 2025,
    },
    {
      id: "3",
      rank: 3,
      name: "Dylan Harper",
      position: "PG/SG",
      school: "Rutgers",
      height: "6'6\"",
      weight: 210,
      age: 19,
      ppg: 21.2,
      rpg: 5.8,
      apg: 5.5,
      fgPct: 48.5,
      threePct: 33.8,
      strengths: ["Shot creation", "Physicality", "Playmaking", "Finishing"],
      weaknesses: ["Three-point shooting", "Defensive effort"],
      comparison: "James Harden",
      projectedPick: "3-5",
      draftYear: 2025,
    },
    {
      id: "4",
      rank: 4,
      name: "VJ Edgecombe",
      position: "SG",
      school: "Baylor",
      height: "6'4\"",
      weight: 185,
      age: 19,
      ppg: 16.5,
      rpg: 4.2,
      apg: 3.2,
      fgPct: 44.5,
      threePct: 36.8,
      strengths: ["Athleticism", "Transition", "Perimeter defense"],
      weaknesses: ["Shot selection", "Playmaking in half-court"],
      comparison: "Anthony Edwards",
      projectedPick: "4-8",
      draftYear: 2025,
    },
    {
      id: "5",
      rank: 5,
      name: "Kon Knueppel",
      position: "SG/SF",
      school: "Duke",
      height: "6'6\"",
      weight: 210,
      age: 20,
      ppg: 14.8,
      rpg: 5.2,
      apg: 2.8,
      fgPct: 46.2,
      threePct: 42.5,
      strengths: ["Shooting", "Basketball IQ", "Size for position"],
      weaknesses: ["Lateral quickness", "Creating own shot"],
      comparison: "Klay Thompson",
      projectedPick: "5-10",
      draftYear: 2025,
    },
    {
      id: "6",
      rank: 6,
      name: "Egor Demin",
      position: "PG",
      school: "BYU",
      height: "6'8\"",
      weight: 185,
      age: 18,
      ppg: 12.5,
      rpg: 4.8,
      apg: 6.2,
      fgPct: 43.5,
      threePct: 34.2,
      strengths: ["Size", "Passing vision", "Ball handling for size"],
      weaknesses: ["Finishing at rim", "Defensive intensity"],
      comparison: "Luka Doncic (lite)",
      projectedPick: "6-12",
      draftYear: 2025,
    },
  ];
}
