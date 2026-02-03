"use client";

import { useState, useEffect } from "react";
import { Header, Footer } from "@/components/layout";
import { BasketballCourt, type Shot } from "@/components/tools/BasketballCourt";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

// Mock shot data - will be replaced with API data
const generateMockShots = (count: number): Shot[] => {
  const shots: Shot[] = [];
  for (let i = 0; i < count; i++) {
    const x = Math.random() * 80 + 10; // Keep within court bounds
    const y = Math.random() * 70 + 5;
    const is3pt = y > 35 || x < 15 || x > 85;
    shots.push({
      x,
      y,
      made: Math.random() > 0.45,
      value: is3pt ? 3 : 2,
    });
  }
  return shots;
};

interface ZoneStats {
  name: string;
  made: number;
  attempted: number;
  percentage: number;
}

export default function ShotChartPage() {
  const [shots, setShots] = useState<Shot[]>([]);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState("LeBron James");
  const [isLoading, setIsLoading] = useState(true);

  // Mock players
  const players = [
    "LeBron James",
    "Stephen Curry",
    "Kevin Durant",
    "Giannis Antetokounmpo",
    "Luka Doncic",
  ];

  useEffect(() => {
    // Simulate loading
    setIsLoading(true);
    setTimeout(() => {
      setShots(generateMockShots(100));
      setIsLoading(false);
    }, 500);
  }, [selectedPlayer]);

  // Calculate zone stats
  const calculateZoneStats = (): ZoneStats[] => {
    const zones = {
      paint: { made: 0, attempted: 0 },
      midRange: { made: 0, attempted: 0 },
      corner3: { made: 0, attempted: 0 },
      aboveBreak3: { made: 0, attempted: 0 },
    };

    shots.forEach((shot) => {
      let zone: keyof typeof zones;

      if (shot.y < 25 && shot.x > 30 && shot.x < 70) {
        zone = "paint";
      } else if (shot.value === 2) {
        zone = "midRange";
      } else if (shot.y < 20) {
        zone = "corner3";
      } else {
        zone = "aboveBreak3";
      }

      zones[zone].attempted++;
      if (shot.made) zones[zone].made++;
    });

    return [
      {
        name: "Paint",
        ...zones.paint,
        percentage: zones.paint.attempted
          ? (zones.paint.made / zones.paint.attempted) * 100
          : 0,
      },
      {
        name: "Mid-Range",
        ...zones.midRange,
        percentage: zones.midRange.attempted
          ? (zones.midRange.made / zones.midRange.attempted) * 100
          : 0,
      },
      {
        name: "Corner 3",
        ...zones.corner3,
        percentage: zones.corner3.attempted
          ? (zones.corner3.made / zones.corner3.attempted) * 100
          : 0,
      },
      {
        name: "Above Break 3",
        ...zones.aboveBreak3,
        percentage: zones.aboveBreak3.attempted
          ? (zones.aboveBreak3.made / zones.aboveBreak3.attempted) * 100
          : 0,
      },
    ];
  };

  const zoneStats = calculateZoneStats();

  // Overall stats
  const totalMade = shots.filter((s) => s.made).length;
  const totalAttempted = shots.length;
  const fgPercentage = totalAttempted ? (totalMade / totalAttempted) * 100 : 0;
  const threeMade = shots.filter((s) => s.made && s.value === 3).length;
  const threeAttempted = shots.filter((s) => s.value === 3).length;
  const threePercentage = threeAttempted ? (threeMade / threeAttempted) * 100 : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-[var(--black)] flex flex-col">
        {/* Hero */}
        <section className="bg-gradient-to-br from-[var(--dark-gray)] to-[var(--black)] py-6 md:py-8 border-b-4 border-[var(--orange)]">
          <div className="container-main">
            <h1 className="font-[family-name:var(--font-anton)] text-3xl md:text-4xl tracking-wider text-white mb-2">
              SHOT CHART ANALYZER
            </h1>
            <p className="text-white/70">
              Visualize shooting patterns with heat maps and zone breakdowns
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className="flex-1 py-6 md:py-8 flex min-h-0">
          <div className="container-main flex-1 flex flex-col min-h-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 flex-1 min-h-0">
              {/* Chart Area */}
              <div className="lg:col-span-2 flex flex-col min-h-0">
                <Card variant="default" className="p-4 md:p-6 flex-1 flex flex-col">
                  {/* Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    {/* Player Select */}
                    <select
                      value={selectedPlayer}
                      onChange={(e) => setSelectedPlayer(e.target.value)}
                      className="bg-[var(--black)] border-2 border-[var(--border)] text-white px-4 py-2 focus:border-[var(--orange)] outline-none"
                    >
                      {players.map((player) => (
                        <option key={player} value={player}>
                          {player}
                        </option>
                      ))}
                    </select>

                    {/* View Toggle */}
                    <div className="flex gap-2">
                      <Button
                        variant={showHeatmap ? "secondary" : "primary"}
                        size="sm"
                        onClick={() => setShowHeatmap(false)}
                      >
                        SHOTS
                      </Button>
                      <Button
                        variant={showHeatmap ? "primary" : "secondary"}
                        size="sm"
                        onClick={() => setShowHeatmap(true)}
                      >
                        HEATMAP
                      </Button>
                    </div>
                  </div>

                  {/* Court */}
                  <div className="flex justify-center items-center flex-1">
                    {isLoading ? (
                      <div className="w-full max-w-[500px] h-[470px] bg-[var(--black)] animate-pulse flex items-center justify-center">
                        <span className="text-white/50">Loading...</span>
                      </div>
                    ) : (
                      <BasketballCourt
                        shots={shots}
                        showHeatmap={showHeatmap}
                        width={500}
                        height={470}
                        className="w-full max-w-[500px]"
                      />
                    )}
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap justify-center gap-6 mt-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-[#22C55E]" />
                      <span className="text-white/70">Made 3PT</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-[#3B82F6]" />
                      <span className="text-white/70">Made 2PT</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-[#EF4444]" />
                      <span className="text-white/70">Missed 3PT</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-[#F59E0B]" />
                      <span className="text-white/70">Missed 2PT</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Stats Sidebar */}
              <div className="flex flex-col gap-6 min-h-0">
                {/* Overall Stats */}
                <Card variant="bordered" className="p-4 md:p-5 flex-1">
                  <h3 className="font-[family-name:var(--font-anton)] text-lg tracking-wider mb-4">
                    OVERALL STATS
                  </h3>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">FG%</span>
                      <span className="font-[family-name:var(--font-roboto-mono)] text-xl font-bold">
                        {fgPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">FGM/FGA</span>
                      <span className="font-[family-name:var(--font-roboto-mono)]">
                        {totalMade}/{totalAttempted}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">3P%</span>
                      <span className="font-[family-name:var(--font-roboto-mono)] text-xl font-bold text-[var(--orange)]">
                        {threePercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">3PM/3PA</span>
                      <span className="font-[family-name:var(--font-roboto-mono)]">
                        {threeMade}/{threeAttempted}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Zone Breakdown */}
                <Card variant="bordered" className="p-4 md:p-5 flex-1">
                  <h3 className="font-[family-name:var(--font-anton)] text-lg tracking-wider mb-4">
                    ZONE BREAKDOWN
                  </h3>

                  <div className="space-y-4">
                    {zoneStats.map((zone) => (
                      <div key={zone.name}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-white/60 text-sm">{zone.name}</span>
                          <span className="font-[family-name:var(--font-roboto-mono)] text-sm">
                            {zone.made}/{zone.attempted} ({zone.percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="h-2 bg-[var(--black)] rounded overflow-hidden">
                          <div
                            className={cn(
                              "h-full transition-all",
                              zone.percentage >= 50
                                ? "bg-green-500"
                                : zone.percentage >= 40
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            )}
                            style={{ width: `${zone.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Quick Actions */}
                <Card variant="bordered" className="p-4 md:p-5 flex-1">
                  <h3 className="font-[family-name:var(--font-anton)] text-lg tracking-wider mb-4">
                    FILTERS
                  </h3>

                  <div className="space-y-3">
                    <Button variant="secondary" size="sm" className="w-full">
                      LAST 5 GAMES
                    </Button>
                    <Button variant="secondary" size="sm" className="w-full">
                      SEASON 2024-25
                    </Button>
                    <Button variant="secondary" size="sm" className="w-full">
                      PLAYOFFS ONLY
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
