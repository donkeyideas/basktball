import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Fetch historical records for public display
export async function GET() {
  try {
    const records = await prisma.historicalRecord.findMany({
      orderBy: { sortOrder: "asc" },
    });

    if (records.length === 0) {
      return NextResponse.json({
        success: true,
        records: getFallbackRecords(),
        source: "fallback",
      });
    }

    return NextResponse.json({
      success: true,
      records,
      source: "database",
    });
  } catch (error) {
    console.error("Error fetching historical records:", error);
    return NextResponse.json({
      success: true,
      records: getFallbackRecords(),
      source: "fallback",
    });
  }
}

function getFallbackRecords() {
  return [
    { id: "1", category: "Career Points", record: "38,387", holder: "LeBron James", date: "Active", details: "Passed Kareem Abdul-Jabbar on Feb 7, 2023" },
    { id: "2", category: "Career Assists", record: "15,806", holder: "John Stockton", date: "1984-2003", details: "3,715 more than second place" },
    { id: "3", category: "Career Rebounds", record: "23,924", holder: "Wilt Chamberlain", date: "1959-1973", details: "Also holds single-game record (55)" },
    { id: "4", category: "Career Steals", record: "3,265", holder: "John Stockton", date: "1984-2003", details: "581 more than second place" },
    { id: "5", category: "Career Blocks", record: "3,830", holder: "Hakeem Olajuwon", date: "1984-2002", details: "Also a dominant scorer" },
    { id: "6", category: "Single Game Points", record: "100", holder: "Wilt Chamberlain", date: "Mar 2, 1962", details: "vs. New York Knicks" },
    { id: "7", category: "Single Season PPG", record: "50.4", holder: "Wilt Chamberlain", date: "1961-62", details: "Also averaged 25.7 RPG" },
    { id: "8", category: "Career 3-Pointers", record: "3,747", holder: "Stephen Curry", date: "Active", details: "Changed the game" },
    { id: "9", category: "Single Season 3PM", record: "402", holder: "Stephen Curry", date: "2015-16", details: "On 45.4% shooting" },
    { id: "10", category: "Triple-Doubles (Career)", record: "194", holder: "Russell Westbrook", date: "Active", details: "Passed Oscar Robertson in 2021" },
  ];
}
