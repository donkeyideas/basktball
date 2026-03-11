import { NextRequest, NextResponse } from "next/server";
import { getPlayerShootingProfile } from "@/lib/api/live-stats";

export const dynamic = "force-dynamic";

interface Shot {
  id: string;
  x: number; // 0-100 percentage from left
  y: number; // 0-100 percentage from top
  made: boolean;
  zone: "paint" | "mid" | "3pt" | "rim";
  distance: number;
  quarter: number;
}

const DEFAULT_PROFILE = { fgPct: 45.0, threePct: 35.0, threeRate: 0.30 };

// GET - Fetch shot chart data for a player
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const { playerId } = await params;

    // Fetch real shooting profile from BDL, fall back to league-average defaults
    const liveProfile = await getPlayerShootingProfile(playerId);
    const profile = liveProfile || DEFAULT_PROFILE;

    // Generate shot chart data based on profile
    const shots = generateShotsFromProfile(playerId, profile);

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
      playerId,
      shots,
      zones,
      summary: {
        totalShots: shots.length,
        totalMade: shots.filter(s => s.made).length,
        overallPct: shots.length > 0
          ? Math.round((shots.filter(s => s.made).length / shots.length) * 100)
          : 0,
      },
      source: "generated",
    });
  } catch (error) {
    console.error("Error fetching shot chart data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch shot chart data" },
      { status: 500 }
    );
  }
}

function generateShotsFromProfile(
  playerId: string,
  profile: { fgPct: number; threePct: number; threeRate: number }
): Shot[] {
  const shots: Shot[] = [];

  const twoPct = (profile.fgPct / 100) * 1.1; // 2pt shots are slightly better than overall
  const threePct = profile.threePct / 100;

  // Generate 100-150 shots
  const totalShots = 100 + Math.floor(Math.random() * 50);

  // Use player ID for semi-deterministic randomness
  const seed = playerId.split("").reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
  let rng = seed;
  const random = () => {
    rng = (rng * 9301 + 49297) % 233280;
    return rng / 233280;
  };

  // Determine shot distribution based on threeRate
  const threePointPct = profile.threeRate;
  const rimPct = (1 - threePointPct) * 0.4;
  const paintPct = (1 - threePointPct) * 0.3;
  const midPct = (1 - threePointPct) * 0.3;

  for (let i = 0; i < totalShots; i++) {
    const shotType = random();
    let x: number, y: number, zone: Shot["zone"], distance: number, makePct: number;

    if (shotType < rimPct) {
      // Rim shots (close to basket)
      x = 45 + random() * 10;
      y = 78 + random() * 10;
      zone = "rim";
      distance = 2 + random() * 3;
      makePct = Math.min(0.70, twoPct * 1.3);
    } else if (shotType < rimPct + paintPct) {
      // Paint shots
      const angle = random() * Math.PI;
      const dist = 5 + random() * 8;
      x = 50 + Math.cos(angle) * dist * 2;
      y = 70 + Math.sin(angle) * dist;
      zone = "paint";
      distance = 4 + random() * 6;
      makePct = twoPct * 0.95;
    } else if (shotType < rimPct + paintPct + midPct) {
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
      x = 50 + Math.cos(angle) * 23 * 2;
      y = 30 + random() * 25;

      // Corner threes (30% of threes)
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

