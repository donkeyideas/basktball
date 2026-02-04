import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

interface Shot {
  id: string;
  x: number; // 0-100 percentage from left
  y: number; // 0-100 percentage from top
  made: boolean;
  zone: "paint" | "mid" | "3pt" | "rim";
  distance: number;
  quarter: number;
}

// GET - Fetch shot chart data for a player
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const { playerId } = await params;

    // Get player with recent game stats
    const player = await prisma.player.findUnique({
      where: { id: playerId },
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
    });

    if (!player) {
      return NextResponse.json(
        { success: false, error: "Player not found" },
        { status: 404 }
      );
    }

    // Generate shot chart data based on player's actual shooting stats
    const shots = generateShotsFromStats(player);

    // Calculate zone percentages
    const zones = {
      paint: { made: 0, total: 0, pct: 0 },
      mid: { made: 0, total: 0, pct: 0 },
      "3pt": { made: 0, total: 0, pct: 0 },
      rim: { made: 0, total: 0, pct: 0 },
    };

    for (const shot of shots) {
      zones[shot.zone].total++;
      if (shot.made) zones[shot.zone].made++;
    }

    for (const zone of Object.keys(zones) as Array<keyof typeof zones>) {
      zones[zone].pct = zones[zone].total > 0
        ? Math.round((zones[zone].made / zones[zone].total) * 100)
        : 0;
    }

    return NextResponse.json({
      success: true,
      player: {
        id: player.id,
        name: player.name,
        team: player.team?.abbreviation || "FA",
      },
      shots,
      zones,
      summary: {
        totalShots: shots.length,
        totalMade: shots.filter(s => s.made).length,
        overallPct: shots.length > 0
          ? Math.round((shots.filter(s => s.made).length / shots.length) * 100)
          : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching shot chart data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch shot chart data" },
      { status: 500 }
    );
  }
}

function generateShotsFromStats(player: any): Shot[] {
  const shots: Shot[] = [];

  // If no stats, return fallback data
  if (!player.stats || player.stats.length === 0) {
    return getFallbackShots();
  }

  // Calculate averages from recent games
  const avgFga = player.stats.reduce((s: number, st: any) => s + st.fga, 0) / player.stats.length;
  const avgFgm = player.stats.reduce((s: number, st: any) => s + st.fgm, 0) / player.stats.length;
  const avgTpa = player.stats.reduce((s: number, st: any) => s + st.tpa, 0) / player.stats.length;
  const avgTpm = player.stats.reduce((s: number, st: any) => s + st.tpm, 0) / player.stats.length;

  const twoPointAttempts = avgFga - avgTpa;
  const twoPointMade = avgFgm - avgTpm;
  const twoPct = twoPointAttempts > 0 ? twoPointMade / twoPointAttempts : 0.45;
  const threePct = avgTpa > 0 ? avgTpm / avgTpa : 0.35;

  // Generate shot locations based on typical patterns
  const totalShots = Math.round(avgFga * 3); // Generate multiple games worth

  // Use player ID for deterministic randomness
  const seed = player.id.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
  let rng = seed;
  const random = () => {
    rng = (rng * 9301 + 49297) % 233280;
    return rng / 233280;
  };

  for (let i = 0; i < totalShots; i++) {
    const shotType = random();
    let x: number, y: number, zone: Shot["zone"], distance: number, makePct: number;

    if (shotType < 0.25) {
      // Rim shots (close to basket)
      x = 45 + random() * 10;
      y = 78 + random() * 10;
      zone = "rim";
      distance = 2 + random() * 3;
      makePct = 0.62;
    } else if (shotType < 0.45) {
      // Paint shots
      const angle = random() * Math.PI;
      const dist = 5 + random() * 8;
      x = 50 + Math.cos(angle) * dist * 2;
      y = 70 + Math.sin(angle) * dist;
      zone = "paint";
      distance = 4 + random() * 6;
      makePct = twoPct * 0.95;
    } else if (shotType < 0.65) {
      // Mid-range shots
      const angle = random() * Math.PI;
      const dist = 12 + random() * 8;
      x = 50 + Math.cos(angle) * dist * 2.5;
      y = 55 + Math.sin(angle) * dist;
      zone = "mid";
      distance = 10 + random() * 8;
      makePct = twoPct * 0.85;
    } else {
      // 3-point shots
      const angle = random() * Math.PI * 0.8 + Math.PI * 0.1;
      const dist = 23 + random() * 4;
      x = 50 + Math.cos(angle) * dist * 2;
      y = 30 + random() * 25;

      // Corner threes
      if (random() < 0.3) {
        x = random() < 0.5 ? 5 + random() * 10 : 85 + random() * 10;
        y = 70 + random() * 15;
      }

      zone = "3pt";
      distance = 22 + random() * 5;
      makePct = threePct;
    }

    // Clamp coordinates
    x = Math.max(2, Math.min(98, x));
    y = Math.max(5, Math.min(95, y));

    shots.push({
      id: `shot-${i}`,
      x,
      y,
      made: random() < makePct,
      zone,
      distance: Math.round(distance),
      quarter: Math.floor(random() * 4) + 1,
    });
  }

  return shots;
}

function getFallbackShots(): Shot[] {
  return [
    { id: "1", x: 50, y: 85, made: true, zone: "rim", distance: 2, quarter: 1 },
    { id: "2", x: 35, y: 70, made: false, zone: "paint", distance: 8, quarter: 1 },
    { id: "3", x: 65, y: 65, made: true, zone: "mid", distance: 12, quarter: 2 },
    { id: "4", x: 15, y: 75, made: true, zone: "3pt", distance: 23, quarter: 2 },
    { id: "5", x: 85, y: 75, made: false, zone: "3pt", distance: 24, quarter: 3 },
    { id: "6", x: 50, y: 35, made: true, zone: "3pt", distance: 25, quarter: 3 },
    { id: "7", x: 45, y: 80, made: true, zone: "rim", distance: 3, quarter: 4 },
    { id: "8", x: 55, y: 55, made: false, zone: "mid", distance: 15, quarter: 4 },
    { id: "9", x: 30, y: 45, made: true, zone: "3pt", distance: 26, quarter: 1 },
    { id: "10", x: 70, y: 40, made: false, zone: "3pt", distance: 27, quarter: 2 },
    { id: "11", x: 48, y: 88, made: true, zone: "rim", distance: 1, quarter: 3 },
    { id: "12", x: 60, y: 70, made: true, zone: "paint", distance: 7, quarter: 4 },
  ];
}
