"use client";

import { useState, useMemo } from "react";
import { Header, Footer } from "@/components/layout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface PlayerMetrics {
  id: string;
  name: string;
  team: string;
  position: string;
  gp: number;
  mpg: number;
  per: number;
  ts: number;
  efg: number;
  usg: number;
  ortg: number;
  drtg: number;
  bpm: number;
  vorp: number;
  ws: number;
  wsPer48: number;
}

// Mock data
const mockMetrics: PlayerMetrics[] = [
  { id: "1", name: "Nikola Jokic", team: "DEN", position: "C", gp: 69, mpg: 33.7, per: 32.0, ts: 66.1, efg: 62.5, usg: 27.1, ortg: 131, drtg: 111, bpm: 13.0, vorp: 9.8, ws: 15.2, wsPer48: 0.320 },
  { id: "2", name: "Luka Doncic", team: "DAL", position: "PG", gp: 66, mpg: 36.2, per: 28.7, ts: 59.0, efg: 52.7, usg: 36.8, ortg: 117, drtg: 113, bpm: 8.8, vorp: 6.8, ws: 9.3, wsPer48: 0.201 },
  { id: "3", name: "Giannis Antetokounmpo", team: "MIL", position: "PF", gp: 63, mpg: 35.2, per: 31.1, ts: 60.5, efg: 57.2, usg: 35.2, ortg: 118, drtg: 107, bpm: 10.9, vorp: 7.4, ws: 11.4, wsPer48: 0.254 },
  { id: "4", name: "Shai Gilgeous-Alexander", team: "OKC", position: "PG", gp: 68, mpg: 34.0, per: 29.1, ts: 61.7, efg: 54.1, usg: 32.4, ortg: 123, drtg: 108, bpm: 9.2, vorp: 7.5, ws: 13.1, wsPer48: 0.270 },
  { id: "5", name: "Joel Embiid", team: "PHI", position: "C", gp: 39, mpg: 33.6, per: 31.4, ts: 65.5, efg: 56.3, usg: 37.1, ortg: 126, drtg: 108, bpm: 10.3, vorp: 4.4, ws: 7.3, wsPer48: 0.297 },
  { id: "6", name: "Jayson Tatum", team: "BOS", position: "SF", gp: 74, mpg: 35.7, per: 23.1, ts: 60.9, efg: 54.8, usg: 30.0, ortg: 119, drtg: 108, bpm: 5.3, vorp: 5.0, ws: 11.0, wsPer48: 0.181 },
  { id: "7", name: "Kevin Durant", team: "PHX", position: "SF", gp: 55, mpg: 37.2, per: 27.2, ts: 64.7, efg: 58.0, usg: 30.4, ortg: 124, drtg: 113, bpm: 6.3, vorp: 4.2, ws: 7.5, wsPer48: 0.205 },
  { id: "8", name: "Anthony Davis", team: "LAL", position: "PF", gp: 55, mpg: 35.1, per: 26.3, ts: 63.2, efg: 56.1, usg: 28.5, ortg: 118, drtg: 106, bpm: 6.2, vorp: 3.9, ws: 8.4, wsPer48: 0.227 },
  { id: "9", name: "Stephen Curry", team: "GSW", position: "PG", gp: 56, mpg: 32.7, per: 24.3, ts: 62.5, efg: 55.2, usg: 29.8, ortg: 119, drtg: 114, bpm: 5.1, vorp: 3.3, ws: 6.4, wsPer48: 0.192 },
  { id: "10", name: "LeBron James", team: "LAL", position: "SF", gp: 55, mpg: 35.3, per: 26.1, ts: 62.3, efg: 55.5, usg: 29.1, ortg: 117, drtg: 113, bpm: 6.0, vorp: 3.8, ws: 7.1, wsPer48: 0.195 },
  { id: "11", name: "Domantas Sabonis", team: "SAC", position: "C", gp: 73, mpg: 34.6, per: 24.5, ts: 62.7, efg: 59.1, usg: 24.2, ortg: 121, drtg: 115, bpm: 4.9, vorp: 4.4, ws: 10.5, wsPer48: 0.202 },
  { id: "12", name: "Tyrese Haliburton", team: "IND", position: "PG", gp: 54, mpg: 32.2, per: 21.8, ts: 63.5, efg: 55.8, usg: 24.6, ortg: 124, drtg: 116, bpm: 5.5, vorp: 3.4, ws: 6.8, wsPer48: 0.211 },
];

type SortKey = keyof Omit<PlayerMetrics, "id" | "name" | "team" | "position">;

const metricInfo: Record<SortKey, { label: string; description: string; format: (v: number) => string }> = {
  gp: { label: "GP", description: "Games Played", format: (v) => v.toString() },
  mpg: { label: "MPG", description: "Minutes Per Game", format: (v) => v.toFixed(1) },
  per: { label: "PER", description: "Player Efficiency Rating", format: (v) => v.toFixed(1) },
  ts: { label: "TS%", description: "True Shooting Percentage", format: (v) => `${v.toFixed(1)}%` },
  efg: { label: "eFG%", description: "Effective Field Goal %", format: (v) => `${v.toFixed(1)}%` },
  usg: { label: "USG%", description: "Usage Rate", format: (v) => `${v.toFixed(1)}%` },
  ortg: { label: "ORtg", description: "Offensive Rating", format: (v) => v.toString() },
  drtg: { label: "DRtg", description: "Defensive Rating", format: (v) => v.toString() },
  bpm: { label: "BPM", description: "Box Plus/Minus", format: (v) => v.toFixed(1) },
  vorp: { label: "VORP", description: "Value Over Replacement", format: (v) => v.toFixed(1) },
  ws: { label: "WS", description: "Win Shares", format: (v) => v.toFixed(1) },
  wsPer48: { label: "WS/48", description: "Win Shares Per 48 Min", format: (v) => v.toFixed(3) },
};

const sortKeys: SortKey[] = ["per", "ts", "efg", "usg", "ortg", "drtg", "bpm", "vorp", "ws", "wsPer48"];

export default function AdvancedMetricsPage() {
  const [sortBy, setSortBy] = useState<SortKey>("per");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [positionFilter, setPositionFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMetric, setSelectedMetric] = useState<SortKey | null>(null);

  const filteredAndSorted = useMemo(() => {
    let data = [...mockMetrics];

    // Filter by position
    if (positionFilter !== "ALL") {
      data = data.filter((p) => p.position === positionFilter);
    }

    // Filter by search
    if (searchQuery) {
      data = data.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.team.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    data.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      // For defensive rating, lower is better
      const multiplier = sortBy === "drtg" ? -1 : 1;
      return sortDir === "desc"
        ? (bVal - aVal) * multiplier
        : (aVal - bVal) * multiplier;
    });

    return data;
  }, [sortBy, sortDir, positionFilter, searchQuery]);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortBy(key);
      setSortDir("desc");
    }
  };

  const positions = ["ALL", "PG", "SG", "SF", "PF", "C"];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-[var(--black)] flex flex-col">
        {/* Hero */}
        <section className="bg-gradient-to-br from-[var(--dark-gray)] to-[var(--black)] py-6 md:py-8 border-b-4 border-[var(--orange)]">
          <div className="container-main">
            <h1 className="font-[family-name:var(--font-anton)] text-3xl md:text-4xl tracking-wider text-white mb-2">
              ADVANCED METRICS
            </h1>
            <p className="text-white/70">
              Deep dive into PER, Win Shares, True Shooting, and 50+ analytics metrics
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className="flex-1 py-6 md:py-8 flex flex-col min-h-0">
          <div className="container-main flex-1 flex flex-col min-h-0">
            {/* Filters */}
            <Card variant="default" className="p-4 md:p-6 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                {/* Search */}
                <input
                  type="text"
                  placeholder="Search player or team..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[var(--black)] border-2 border-[var(--border)] text-white px-4 py-2 focus:border-[var(--orange)] outline-none flex-1 min-w-[200px]"
                />

                {/* Position Filter */}
                <div className="flex gap-1">
                  {positions.map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setPositionFilter(pos)}
                      className={cn(
                        "px-3 py-2 text-sm font-semibold transition-colors",
                        positionFilter === pos
                          ? "bg-[var(--orange)] text-white"
                          : "bg-[var(--dark-gray)] text-white/60 hover:text-white"
                      )}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Metric Info Card */}
            {selectedMetric && (
              <Card variant="bordered" className="p-4 mb-6 border-[var(--orange)]">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-[var(--orange)]">
                      {metricInfo[selectedMetric].label}
                    </h3>
                    <p className="text-white/70 text-sm">
                      {metricInfo[selectedMetric].description}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedMetric(null)}
                    className="text-white/50 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              </Card>
            )}

            {/* Stats Table */}
            <Card variant="default" className="overflow-hidden flex-1 flex flex-col min-h-0">
              <div className="overflow-x-auto flex-1 overflow-y-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[var(--dark-gray)]">
                      <th className="px-3 py-3 text-left text-xs font-semibold text-white/60 sticky left-0 bg-[var(--dark-gray)]">
                        #
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-white/60 sticky left-8 bg-[var(--dark-gray)] min-w-[150px]">
                        PLAYER
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-white/60">
                        TEAM
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-white/60">
                        POS
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-white/60">
                        GP
                      </th>
                      {sortKeys.map((key) => (
                        <th
                          key={key}
                          onClick={() => handleSort(key)}
                          onMouseEnter={() => setSelectedMetric(key)}
                          className={cn(
                            "px-3 py-3 text-center text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap",
                            sortBy === key ? "text-[var(--orange)]" : "text-white/60 hover:text-white"
                          )}
                        >
                          {metricInfo[key].label}
                          {sortBy === key && (
                            <span className="ml-1">{sortDir === "desc" ? "↓" : "↑"}</span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSorted.map((player, index) => (
                      <tr
                        key={player.id}
                        className={cn(
                          "border-t border-white/10 hover:bg-[var(--gray)] transition-colors",
                          index % 2 === 0 ? "bg-[var(--black)]" : "bg-[var(--dark-gray)]"
                        )}
                      >
                        <td className="px-3 py-3 text-white/50 text-sm sticky left-0 bg-inherit">
                          {index + 1}
                        </td>
                        <td className="px-3 py-3 font-semibold text-white sticky left-8 bg-inherit">
                          {player.name}
                        </td>
                        <td className="px-3 py-3 text-center text-white/70 text-sm">
                          {player.team}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="bg-[var(--orange)]/20 text-[var(--orange)] px-2 py-0.5 text-xs">
                            {player.position}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center text-white/70 text-sm">
                          {player.gp}
                        </td>
                        {sortKeys.map((key) => {
                          const value = player[key];
                          const isHighlight = sortBy === key;
                          return (
                            <td
                              key={key}
                              className={cn(
                                "px-3 py-3 text-center font-[family-name:var(--font-roboto-mono)] text-sm",
                                isHighlight ? "text-[var(--orange)] font-bold" : "text-white"
                              )}
                            >
                              {metricInfo[key].format(value)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Legend */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {sortKeys.map((key) => (
                <div
                  key={key}
                  className="bg-[var(--dark-gray)] p-3 cursor-pointer hover:bg-[var(--gray)] transition-colors"
                  onClick={() => setSelectedMetric(key)}
                >
                  <span className="text-[var(--orange)] font-bold">{metricInfo[key].label}</span>
                  <p className="text-xs text-white/50 mt-1">{metricInfo[key].description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
