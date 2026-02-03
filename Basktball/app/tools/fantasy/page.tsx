"use client";

import { useState, useMemo } from "react";
import { Header, Footer } from "@/components/layout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface FantasyPlayer {
  id: string;
  name: string;
  team: string;
  position: string;
  opponent: string;
  salary: number;
  projection: number;
  value: number; // projection / salary * 1000
  ownership: number;
  isHot: boolean;
  isValue: boolean;
}

// Mock data
const mockPlayers: FantasyPlayer[] = [
  { id: "1", name: "Nikola Jokic", team: "DEN", position: "C", opponent: "PHX", salary: 12000, projection: 62.5, value: 5.21, ownership: 32.1, isHot: true, isValue: false },
  { id: "2", name: "Luka Doncic", team: "DAL", position: "PG", opponent: "OKC", salary: 11800, projection: 58.2, value: 4.93, ownership: 28.5, isHot: true, isValue: false },
  { id: "3", name: "Shai Gilgeous-Alexander", team: "OKC", position: "PG", opponent: "DAL", salary: 10600, projection: 54.1, value: 5.10, ownership: 24.3, isHot: true, isValue: false },
  { id: "4", name: "Giannis Antetokounmpo", team: "MIL", position: "PF", opponent: "BOS", salary: 11400, projection: 56.8, value: 4.98, ownership: 26.7, isHot: false, isValue: false },
  { id: "5", name: "Anthony Edwards", team: "MIN", position: "SG", opponent: "LAC", salary: 9200, projection: 48.3, value: 5.25, ownership: 18.9, isHot: true, isValue: true },
  { id: "6", name: "Jayson Tatum", team: "BOS", position: "SF", opponent: "MIL", salary: 10200, projection: 49.5, value: 4.85, ownership: 21.4, isHot: false, isValue: false },
  { id: "7", name: "Tyrese Maxey", team: "PHI", position: "PG", opponent: "IND", salary: 7800, projection: 42.1, value: 5.40, ownership: 15.2, isHot: true, isValue: true },
  { id: "8", name: "Domantas Sabonis", team: "SAC", position: "C", opponent: "HOU", salary: 9400, projection: 51.2, value: 5.45, ownership: 19.8, isHot: false, isValue: true },
  { id: "9", name: "De'Aaron Fox", team: "SAC", position: "PG", opponent: "HOU", salary: 8600, projection: 44.7, value: 5.20, ownership: 16.3, isHot: false, isValue: true },
  { id: "10", name: "Chet Holmgren", team: "OKC", position: "C", opponent: "DAL", salary: 7200, projection: 38.5, value: 5.35, ownership: 12.8, isHot: false, isValue: true },
  { id: "11", name: "Franz Wagner", team: "ORL", position: "SF", opponent: "CHA", salary: 7600, projection: 41.2, value: 5.42, ownership: 14.1, isHot: true, isValue: true },
  { id: "12", name: "Jalen Williams", team: "OKC", position: "SG", opponent: "DAL", salary: 7000, projection: 36.8, value: 5.26, ownership: 11.5, isHot: false, isValue: true },
  { id: "13", name: "Immanuel Quickley", team: "TOR", position: "PG", opponent: "DET", salary: 5800, projection: 32.4, value: 5.59, ownership: 8.7, isHot: false, isValue: true },
  { id: "14", name: "Jalen Green", team: "HOU", position: "SG", opponent: "SAC", salary: 6400, projection: 34.1, value: 5.33, ownership: 9.2, isHot: false, isValue: true },
  { id: "15", name: "Alperen Sengun", team: "HOU", position: "C", opponent: "SAC", salary: 6800, projection: 37.5, value: 5.51, ownership: 10.4, isHot: true, isValue: true },
];

type SortKey = "salary" | "projection" | "value" | "ownership";

const SALARY_CAP = 50000;

export default function FantasyPage() {
  const [roster, setRoster] = useState<FantasyPlayer[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>("value");
  const [positionFilter, setPositionFilter] = useState<string>("ALL");
  const [showValueOnly, setShowValueOnly] = useState(false);

  const positions = ["ALL", "PG", "SG", "SF", "PF", "C"];

  const filteredPlayers = useMemo(() => {
    let data = [...mockPlayers];

    // Filter by position
    if (positionFilter !== "ALL") {
      data = data.filter((p) => p.position === positionFilter);
    }

    // Filter value plays only
    if (showValueOnly) {
      data = data.filter((p) => p.isValue);
    }

    // Sort
    data.sort((a, b) => b[sortBy] - a[sortBy]);

    return data;
  }, [sortBy, positionFilter, showValueOnly]);

  const rosterSalary = roster.reduce((sum, p) => sum + p.salary, 0);
  const rosterProjection = roster.reduce((sum, p) => sum + p.projection, 0);
  const remainingSalary = SALARY_CAP - rosterSalary;

  const addToRoster = (player: FantasyPlayer) => {
    if (roster.find((p) => p.id === player.id)) return;
    if (rosterSalary + player.salary > SALARY_CAP) return;
    if (roster.length >= 8) return;

    setRoster([...roster, player]);
  };

  const removeFromRoster = (playerId: string) => {
    setRoster(roster.filter((p) => p.id !== playerId));
  };

  const clearRoster = () => {
    setRoster([]);
  };

  const optimizeRoster = () => {
    // Simple greedy optimization - pick best value players that fit salary
    const sorted = [...mockPlayers].sort((a, b) => b.value - a.value);
    const optimized: FantasyPlayer[] = [];
    let salary = 0;

    for (const player of sorted) {
      if (optimized.length >= 8) break;
      if (salary + player.salary <= SALARY_CAP) {
        optimized.push(player);
        salary += player.salary;
      }
    }

    setRoster(optimized);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-[var(--black)] flex flex-col">
        {/* Hero */}
        <section className="bg-gradient-to-br from-[var(--dark-gray)] to-[var(--black)] py-6 md:py-8 border-b-4 border-[var(--orange)]">
          <div className="container-main">
            <h1 className="font-[family-name:var(--font-anton)] text-3xl md:text-4xl tracking-wider text-white mb-2">
              FANTASY OPTIMIZER
            </h1>
            <p className="text-white/70">
              Optimize DFS lineups with projections, value picks, and salary optimization
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className="flex-1 py-6 md:py-8 flex min-h-0">
          <div className="container-main flex-1 flex flex-col min-h-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 flex-1 min-h-0">
              {/* Player Pool */}
              <div className="lg:col-span-2 flex flex-col min-h-0">
                <Card variant="default" className="p-4 md:p-6 flex-1 flex flex-col min-h-0">
                  {/* Filters */}
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="flex gap-1">
                      {positions.map((pos) => (
                        <button
                          key={pos}
                          onClick={() => setPositionFilter(pos)}
                          className={cn(
                            "px-3 py-1.5 text-xs font-semibold transition-colors",
                            positionFilter === pos
                              ? "bg-[var(--orange)] text-white"
                              : "bg-[var(--dark-gray)] text-white/60 hover:text-white"
                          )}
                        >
                          {pos}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showValueOnly}
                          onChange={(e) => setShowValueOnly(e.target.checked)}
                          className="accent-[var(--orange)]"
                        />
                        Value Plays Only
                      </label>

                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortKey)}
                        className="bg-[var(--black)] border border-[var(--border)] text-white text-sm px-3 py-1.5"
                      >
                        <option value="value">Sort by Value</option>
                        <option value="projection">Sort by Projection</option>
                        <option value="salary">Sort by Salary</option>
                        <option value="ownership">Sort by Ownership</option>
                      </select>
                    </div>
                  </div>

                  {/* Player Table */}
                  <div className="overflow-x-auto flex-1 overflow-y-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="px-3 py-2 text-left text-xs font-semibold text-white/60">PLAYER</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-white/60">POS</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-white/60">OPP</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-white/60">SALARY</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-white/60">PROJ</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-white/60">VALUE</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-white/60">OWN%</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-white/60"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPlayers.map((player) => {
                          const isInRoster = roster.find((p) => p.id === player.id);
                          const canAdd = !isInRoster && rosterSalary + player.salary <= SALARY_CAP && roster.length < 8;

                          return (
                            <tr
                              key={player.id}
                              className={cn(
                                "border-b border-white/5 hover:bg-[var(--gray)] transition-colors",
                                isInRoster && "bg-[var(--orange)]/10"
                              )}
                            >
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-2">
                                  {player.isHot && <span className="text-xs">🔥</span>}
                                  <span className="font-semibold text-sm">{player.name}</span>
                                  <span className="text-xs text-white/50">{player.team}</span>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-center">
                                <span className="text-xs bg-[var(--dark-gray)] px-2 py-0.5">
                                  {player.position}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-center text-sm text-white/70">
                                @{player.opponent}
                              </td>
                              <td className="px-3 py-3 text-center font-[family-name:var(--font-roboto-mono)] text-sm">
                                ${player.salary.toLocaleString()}
                              </td>
                              <td className="px-3 py-3 text-center font-[family-name:var(--font-roboto-mono)] text-sm text-[var(--orange)]">
                                {player.projection.toFixed(1)}
                              </td>
                              <td className="px-3 py-3 text-center font-[family-name:var(--font-roboto-mono)] text-sm">
                                <span className={cn(player.value >= 5.3 && "text-green-400")}>
                                  {player.value.toFixed(2)}x
                                </span>
                              </td>
                              <td className="px-3 py-3 text-center text-sm text-white/60">
                                {player.ownership}%
                              </td>
                              <td className="px-3 py-3 text-center">
                                {isInRoster ? (
                                  <button
                                    onClick={() => removeFromRoster(player.id)}
                                    className="text-red-400 hover:text-red-300 text-sm"
                                  >
                                    Remove
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => addToRoster(player)}
                                    disabled={!canAdd}
                                    className={cn(
                                      "text-sm",
                                      canAdd
                                        ? "text-[var(--orange)] hover:text-[var(--orange-bright)]"
                                        : "text-white/30 cursor-not-allowed"
                                    )}
                                  >
                                    + Add
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>

              {/* Roster Builder */}
              <div className="lg:col-span-1 flex flex-col min-h-0">
                <Card variant="bordered" className="p-5 flex-1 flex flex-col">
                  <h3 className="font-[family-name:var(--font-anton)] text-xl tracking-wider mb-4">
                    MY LINEUP
                  </h3>

                  {/* Salary Cap */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white/60">Salary Used</span>
                      <span className="font-[family-name:var(--font-roboto-mono)]">
                        ${rosterSalary.toLocaleString()} / ${SALARY_CAP.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 bg-[var(--black)] rounded overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all",
                          rosterSalary / SALARY_CAP > 0.95
                            ? "bg-green-500"
                            : rosterSalary / SALARY_CAP > 0.8
                              ? "bg-yellow-500"
                              : "bg-[var(--orange)]"
                        )}
                        style={{ width: `${(rosterSalary / SALARY_CAP) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-white/50 mt-1">
                      Remaining: ${remainingSalary.toLocaleString()}
                    </p>
                  </div>

                  {/* Roster List */}
                  <div className="space-y-2 mb-4 flex-1 overflow-y-auto">
                    {roster.length === 0 ? (
                      <div className="text-center py-8 text-white/40 text-sm">
                        Add players to build your lineup
                      </div>
                    ) : (
                      roster.map((player) => (
                        <div
                          key={player.id}
                          className="flex items-center justify-between bg-[var(--black)] p-3"
                        >
                          <div>
                            <p className="font-semibold text-sm">{player.name}</p>
                            <p className="text-xs text-white/50">
                              {player.position} • ${player.salary.toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-[var(--orange)]">{player.projection.toFixed(1)}</p>
                            <button
                              onClick={() => removeFromRoster(player.id)}
                              className="text-xs text-red-400 hover:text-red-300"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Projected Score */}
                  <div className="bg-[var(--dark-gray)] p-4 mb-4 text-center">
                    <p className="text-xs text-white/50 mb-1">PROJECTED SCORE</p>
                    <p className="font-[family-name:var(--font-roboto-mono)] text-3xl font-bold text-[var(--orange)]">
                      {rosterProjection.toFixed(1)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full"
                      onClick={optimizeRoster}
                    >
                      AUTO-OPTIMIZE
                    </Button>
                    <Button
                      variant="secondary"
                      size="md"
                      className="w-full"
                      onClick={clearRoster}
                      disabled={roster.length === 0}
                    >
                      CLEAR LINEUP
                    </Button>
                  </div>

                  <p className="text-xs text-white/40 text-center mt-4">
                    {roster.length}/8 players selected
                  </p>
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
