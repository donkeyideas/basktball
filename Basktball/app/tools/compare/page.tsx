"use client";

import { useState } from "react";
import { Header, Footer } from "@/components/layout";
import { RadarChart } from "@/components/tools/RadarChart";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface PlayerStats {
  id: string;
  name: string;
  team: string;
  position: string;
  imageUrl: string;
  stats: {
    ppg: number;
    rpg: number;
    apg: number;
    spg: number;
    bpg: number;
    fgPct: number;
    threePct: number;
    ftPct: number;
    per: number;
    ts: number;
  };
}

// Mock player data
const mockPlayers: PlayerStats[] = [
  {
    id: "1",
    name: "LeBron James",
    team: "Los Angeles Lakers",
    position: "SF",
    imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/2544.png",
    stats: { ppg: 25.7, rpg: 7.3, apg: 8.3, spg: 1.3, bpg: 0.5, fgPct: 54.0, threePct: 41.0, ftPct: 75.0, per: 26.1, ts: 62.3 },
  },
  {
    id: "2",
    name: "Stephen Curry",
    team: "Golden State Warriors",
    position: "PG",
    imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/201939.png",
    stats: { ppg: 26.4, rpg: 4.5, apg: 6.1, spg: 0.9, bpg: 0.4, fgPct: 45.0, threePct: 40.8, ftPct: 92.3, per: 24.3, ts: 62.5 },
  },
  {
    id: "3",
    name: "Kevin Durant",
    team: "Phoenix Suns",
    position: "SF",
    imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/201142.png",
    stats: { ppg: 29.1, rpg: 6.6, apg: 5.0, spg: 0.9, bpg: 1.4, fgPct: 52.3, threePct: 40.4, ftPct: 85.6, per: 27.2, ts: 64.7 },
  },
  {
    id: "4",
    name: "Giannis Antetokounmpo",
    team: "Milwaukee Bucks",
    position: "PF",
    imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/203507.png",
    stats: { ppg: 30.4, rpg: 11.5, apg: 5.7, spg: 1.1, bpg: 1.0, fgPct: 61.1, threePct: 27.5, ftPct: 64.5, per: 31.1, ts: 60.5 },
  },
  {
    id: "5",
    name: "Luka Doncic",
    team: "Dallas Mavericks",
    position: "PG",
    imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1629029.png",
    stats: { ppg: 32.4, rpg: 8.6, apg: 8.0, spg: 1.4, bpg: 0.5, fgPct: 48.7, threePct: 38.2, ftPct: 78.6, per: 28.7, ts: 59.0 },
  },
  {
    id: "6",
    name: "Nikola Jokic",
    team: "Denver Nuggets",
    position: "C",
    imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/203999.png",
    stats: { ppg: 26.4, rpg: 12.4, apg: 9.0, spg: 1.4, bpg: 0.7, fgPct: 58.3, threePct: 35.9, ftPct: 81.7, per: 32.0, ts: 66.1 },
  },
];

// Normalize stats for radar chart (0-100 scale)
function normalizeStats(stats: PlayerStats["stats"]) {
  return [
    { label: "PPG", value: Math.min((stats.ppg / 35) * 100, 100) },
    { label: "RPG", value: Math.min((stats.rpg / 15) * 100, 100) },
    { label: "APG", value: Math.min((stats.apg / 12) * 100, 100) },
    { label: "STL", value: Math.min((stats.spg / 2.5) * 100, 100) },
    { label: "BLK", value: Math.min((stats.bpg / 3) * 100, 100) },
    { label: "TS%", value: stats.ts },
  ];
}

export default function ComparePage() {
  const [player1, setPlayer1] = useState<PlayerStats | null>(mockPlayers[0]);
  const [player2, setPlayer2] = useState<PlayerStats | null>(mockPlayers[3]);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPlayers = mockPlayers.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statCategories = [
    { key: "ppg", label: "Points", format: (v: number) => v.toFixed(1) },
    { key: "rpg", label: "Rebounds", format: (v: number) => v.toFixed(1) },
    { key: "apg", label: "Assists", format: (v: number) => v.toFixed(1) },
    { key: "spg", label: "Steals", format: (v: number) => v.toFixed(1) },
    { key: "bpg", label: "Blocks", format: (v: number) => v.toFixed(1) },
    { key: "fgPct", label: "FG%", format: (v: number) => `${v.toFixed(1)}%` },
    { key: "threePct", label: "3P%", format: (v: number) => `${v.toFixed(1)}%` },
    { key: "ftPct", label: "FT%", format: (v: number) => `${v.toFixed(1)}%` },
    { key: "per", label: "PER", format: (v: number) => v.toFixed(1) },
    { key: "ts", label: "TS%", format: (v: number) => `${v.toFixed(1)}%` },
  ];

  const getWinner = (key: string) => {
    if (!player1 || !player2) return null;
    const v1 = player1.stats[key as keyof typeof player1.stats];
    const v2 = player2.stats[key as keyof typeof player2.stats];
    if (v1 > v2) return 1;
    if (v2 > v1) return 2;
    return null;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-[var(--black)]">
        {/* Hero */}
        <section className="bg-gradient-to-br from-[var(--dark-gray)] to-[var(--black)] py-8 md:py-12 border-b-4 border-[var(--orange)]">
          <div className="container-main">
            <h1 className="font-[family-name:var(--font-anton)] text-3xl md:text-4xl tracking-wider text-white mb-2">
              PLAYER COMPARISON
            </h1>
            <p className="text-white/70">
              Compare any players with side-by-side stats and visual breakdowns
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-8 md:py-12">
          <div className="container-main">
            {/* Player Selection */}
            <Card variant="default" className="p-4 md:p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Player 1 Selector */}
                <div>
                  <label className="block text-sm text-white/60 mb-2">PLAYER 1</label>
                  <select
                    value={player1?.id || ""}
                    onChange={(e) => setPlayer1(mockPlayers.find((p) => p.id === e.target.value) || null)}
                    className="w-full bg-[var(--black)] border-2 border-[var(--orange)] text-white px-4 py-3 focus:outline-none"
                  >
                    <option value="">Select Player</option>
                    {mockPlayers.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name} ({player.team})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Player 2 Selector */}
                <div>
                  <label className="block text-sm text-white/60 mb-2">PLAYER 2</label>
                  <select
                    value={player2?.id || ""}
                    onChange={(e) => setPlayer2(mockPlayers.find((p) => p.id === e.target.value) || null)}
                    className="w-full bg-[var(--black)] border-2 border-[var(--blue)] text-white px-4 py-3 focus:outline-none"
                    style={{ borderColor: "#3B82F6" }}
                  >
                    <option value="">Select Player</option>
                    {mockPlayers.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name} ({player.team})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>

            {player1 && player2 && (
              <>
                {/* Player Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Player 1 Card */}
                  <Card variant="bordered" className="p-5 border-[var(--orange)]">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-20 h-20 bg-cover bg-top rounded"
                        style={{ backgroundImage: `url('${player1.imageUrl}')` }}
                      />
                      <div>
                        <h3 className="font-[family-name:var(--font-anton)] text-xl tracking-wider">
                          {player1.name}
                        </h3>
                        <p className="text-white/60 text-sm">{player1.team}</p>
                        <span className="text-xs bg-[var(--orange)] px-2 py-0.5 mt-1 inline-block">
                          {player1.position}
                        </span>
                      </div>
                    </div>
                  </Card>

                  {/* Player 2 Card */}
                  <Card variant="bordered" className="p-5" style={{ borderColor: "#3B82F6" }}>
                    <div className="flex items-center gap-4">
                      <div
                        className="w-20 h-20 bg-cover bg-top rounded"
                        style={{ backgroundImage: `url('${player2.imageUrl}')` }}
                      />
                      <div>
                        <h3 className="font-[family-name:var(--font-anton)] text-xl tracking-wider">
                          {player2.name}
                        </h3>
                        <p className="text-white/60 text-sm">{player2.team}</p>
                        <span className="text-xs px-2 py-0.5 mt-1 inline-block" style={{ backgroundColor: "#3B82F6" }}>
                          {player2.position}
                        </span>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Radar Chart */}
                <Card variant="default" className="p-6 mb-8">
                  <h3 className="font-[family-name:var(--font-anton)] text-xl tracking-wider mb-6 text-center">
                    STATISTICAL COMPARISON
                  </h3>
                  <div className="flex justify-center">
                    <RadarChart
                      data={normalizeStats(player1.stats)}
                      compareData={normalizeStats(player2.stats)}
                      size={350}
                      primaryColor="#F47B20"
                      secondaryColor="#3B82F6"
                    />
                  </div>
                  <div className="flex justify-center gap-8 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-[var(--orange)]" />
                      <span className="text-sm text-white/70">{player1.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4" style={{ backgroundColor: "#3B82F6" }} />
                      <span className="text-sm text-white/70">{player2.name}</span>
                    </div>
                  </div>
                </Card>

                {/* Stats Table */}
                <Card variant="default" className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-[var(--dark-gray)]">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-white/60">STAT</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: "#F47B20" }}>
                            {player1.name.split(" ")[1]}
                          </th>
                          <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: "#3B82F6" }}>
                            {player2.name.split(" ")[1]}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {statCategories.map((cat, i) => {
                          const winner = getWinner(cat.key);
                          return (
                            <tr
                              key={cat.key}
                              className={cn(
                                "border-t border-white/10",
                                i % 2 === 0 ? "bg-[var(--black)]" : "bg-[var(--dark-gray)]"
                              )}
                            >
                              <td className="px-4 py-3 text-white/70">{cat.label}</td>
                              <td
                                className={cn(
                                  "px-4 py-3 text-center font-[family-name:var(--font-roboto-mono)]",
                                  winner === 1 ? "text-[var(--orange)] font-bold" : "text-white"
                                )}
                              >
                                {cat.format(player1.stats[cat.key as keyof typeof player1.stats])}
                              </td>
                              <td
                                className={cn(
                                  "px-4 py-3 text-center font-[family-name:var(--font-roboto-mono)]",
                                  winner === 2 ? "font-bold" : "text-white"
                                )}
                                style={{ color: winner === 2 ? "#3B82F6" : undefined }}
                              >
                                {cat.format(player2.stats[cat.key as keyof typeof player2.stats])}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </>
            )}

            {(!player1 || !player2) && (
              <div className="text-center py-16 text-white/50">
                <p className="text-xl">Select two players to compare</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
