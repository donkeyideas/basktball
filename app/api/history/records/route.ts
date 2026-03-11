import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

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
  // Verified NBA historical records (static facts + active player counts updated for 2025-26 season)
  return [
    { id: "1", category: "Career Points", record: "42,925+", holder: "LeBron James", date: "Active (2003-present)", details: "First player to reach 40,000 career points; record still growing" },
    { id: "2", category: "Career Assists", record: "15,806", holder: "John Stockton", date: "1984-2003", details: "3,715 more than second place (Jason Kidd, 12,091)" },
    { id: "3", category: "Career Rebounds", record: "23,924", holder: "Wilt Chamberlain", date: "1959-1973", details: "Also holds single-game rebound record (55)" },
    { id: "4", category: "Career Steals", record: "3,265", holder: "John Stockton", date: "1984-2003", details: "581 more than second place (Jason Kidd, 2,684)" },
    { id: "5", category: "Career Blocks", record: "3,830", holder: "Hakeem Olajuwon", date: "1984-2002", details: "Also won two championships and one MVP" },
    { id: "6", category: "Single Game Points", record: "100", holder: "Wilt Chamberlain", date: "Mar 2, 1962", details: "vs. New York Knicks in Hershey, PA" },
    { id: "7", category: "Single Season PPG", record: "50.4", holder: "Wilt Chamberlain", date: "1961-62", details: "Also averaged 25.7 RPG that season" },
    { id: "8", category: "Career 3-Pointers", record: "4,233+", holder: "Stephen Curry", date: "Active (2009-present)", details: "First and only player to reach 4,000 career three-pointers; record still growing" },
    { id: "9", category: "Single Season 3PM", record: "402", holder: "Stephen Curry", date: "2015-16", details: "Shot 45.4% from three-point range" },
    { id: "10", category: "Triple-Doubles (Career)", record: "220+", holder: "Russell Westbrook", date: "Active (2008-present)", details: "Passed Oscar Robertson (181) in 2021; includes 208 regular season and 12 playoff triple-doubles" },
  ];
}
