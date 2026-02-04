import { NextRequest, NextResponse } from "next/server";

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

// Player shooting profiles (2025-26 season stats)
const PLAYER_PROFILES: Record<string, { fgPct: number; threePct: number; threeRate: number }> = {
  "1629029": { fgPct: 47.5, threePct: 35.2, threeRate: 0.35 }, // Luka (LAL)
  "1628983": { fgPct: 53.2, threePct: 35.5, threeRate: 0.25 }, // SGA
  "1630162": { fgPct: 45.2, threePct: 35.8, threeRate: 0.35 }, // Edwards
  "1627759": { fgPct: 50.5, threePct: 36.8, threeRate: 0.35 }, // Jaylen Brown
  "1630224": { fgPct: 45.8, threePct: 38.2, threeRate: 0.40 }, // Maxey
  "1628378": { fgPct: 46.8, threePct: 39.2, threeRate: 0.40 }, // Mitchell
  "202695": { fgPct: 51.2, threePct: 39.5, threeRate: 0.30 },  // Kawhi
  "1628374": { fgPct: 46.2, threePct: 38.8, threeRate: 0.45 }, // Markkanen
  "201939": { fgPct: 45.5, threePct: 41.5, threeRate: 0.55 },  // Curry
  "1628973": { fgPct: 47.2, threePct: 38.5, threeRate: 0.40 }, // Brunson
  "201142": { fgPct: 52.8, threePct: 40.5, threeRate: 0.35 },  // KD (HOU)
  "1628966": { fgPct: 48.5, threePct: 38.5, threeRate: 0.45 }, // MPJ (BKN)
  "1628969": { fgPct: 48.5, threePct: 37.2, threeRate: 0.40 }, // Murray
  "1630166": { fgPct: 46.5, threePct: 36.2, threeRate: 0.35 }, // Avdija
  "1626164": { fgPct: 48.8, threePct: 38.5, threeRate: 0.35 }, // Booker
  "201935": { fgPct: 44.2, threePct: 36.5, threeRate: 0.50 },  // Harden
  "1630595": { fgPct: 44.8, threePct: 35.5, threeRate: 0.40 }, // Cade
  "1630524": { fgPct: 42.5, threePct: 35.2, threeRate: 0.50 }, // Keyonte George
  "1641705": { fgPct: 47.8, threePct: 34.5, threeRate: 0.35 }, // Wemby
  "1627783": { fgPct: 49.5, threePct: 33.5, threeRate: 0.25 }, // Siakam
  "1629636": { fgPct: 48.2, threePct: 33.2, threeRate: 0.25 }, // Jalen Johnson
  "1626181": { fgPct: 47.8, threePct: 40.2, threeRate: 0.45 }, // Norman Powell
  "203944": { fgPct: 45.2, threePct: 35.5, threeRate: 0.30 },  // Randle
  "1627742": { fgPct: 47.5, threePct: 34.8, threeRate: 0.30 }, // Ingram
  "1630549": { fgPct: 45.8, threePct: 36.5, threeRate: 0.40 }, // Sharpe
  "2544": { fgPct: 50.2, threePct: 37.5, threeRate: 0.30 },    // LeBron
};

const DEFAULT_PROFILE = { fgPct: 45.0, threePct: 35.0, threeRate: 0.30 };

// GET - Fetch shot chart data for a player
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const { playerId } = await params;

    // Get player profile or use default
    const profile = PLAYER_PROFILES[playerId] || DEFAULT_PROFILE;

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

