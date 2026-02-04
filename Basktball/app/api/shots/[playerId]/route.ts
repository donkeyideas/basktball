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

// Player shooting profiles (based on real stats)
const PLAYER_PROFILES: Record<string, { fgPct: number; threePct: number; threeRate: number }> = {
  "1629029": { fgPct: 48.7, threePct: 35.4, threeRate: 0.35 }, // Luka
  "1628983": { fgPct: 53.5, threePct: 35.3, threeRate: 0.25 }, // SGA
  "203507": { fgPct: 60.5, threePct: 27.1, threeRate: 0.15 },  // Giannis
  "203954": { fgPct: 52.1, threePct: 38.8, threeRate: 0.20 },  // Embiid
  "1628369": { fgPct: 45.8, threePct: 37.6, threeRate: 0.40 }, // Tatum
  "203999": { fgPct: 58.2, threePct: 36.4, threeRate: 0.25 },  // Jokic
  "1629027": { fgPct: 43.0, threePct: 34.2, threeRate: 0.45 }, // Trae
  "201142": { fgPct: 52.3, threePct: 42.1, threeRate: 0.35 },  // KD
  "1626164": { fgPct: 49.2, threePct: 38.9, threeRate: 0.35 }, // Booker
  "203076": { fgPct: 55.6, threePct: 32.4, threeRate: 0.15 },  // AD
  "1628378": { fgPct: 45.2, threePct: 36.8, threeRate: 0.40 }, // Mitchell
  "1630162": { fgPct: 44.5, threePct: 35.5, threeRate: 0.35 }, // Edwards
  "1629630": { fgPct: 46.8, threePct: 31.2, threeRate: 0.25 }, // Ja Morant
  "1630595": { fgPct: 43.2, threePct: 34.5, threeRate: 0.35 }, // Cade
  "1641705": { fgPct: 46.5, threePct: 32.8, threeRate: 0.30 }, // Wemby
  "1628368": { fgPct: 47.2, threePct: 33.5, threeRate: 0.30 }, // Fox
  "1629639": { fgPct: 44.8, threePct: 36.4, threeRate: 0.50 }, // Haliburton
  "203081": { fgPct: 43.8, threePct: 36.2, threeRate: 0.45 },  // Lillard
  "1630163": { fgPct: 43.5, threePct: 35.8, threeRate: 0.40 }, // LaMelo
  "203506": { fgPct: 59.4, threePct: 32.7, threeRate: 0.15 },  // Sabonis
  "1630559": { fgPct: 45.5, threePct: 34.2, threeRate: 0.30 }, // Franz
  "203110": { fgPct: 44.5, threePct: 37.5, threeRate: 0.40 },  // Garland
  "1629628": { fgPct: 44.8, threePct: 33.8, threeRate: 0.30 }, // RJ Barrett
  "1630224": { fgPct: 45.8, threePct: 37.2, threeRate: 0.40 }, // Maxey
  "1628991": { fgPct: 47.1, threePct: 32.4, threeRate: 0.30 }, // JJJ
  "202691": { fgPct: 43.5, threePct: 38.5, threeRate: 0.60 },  // Klay
  "203497": { fgPct: 66.8, threePct: 0.0, threeRate: 0.00 },   // Gobert
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

