"use client";

import { useState } from "react";
import useSWR from "swr";
import { Header, Footer } from "@/components/layout";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface PlayerStat {
  rank: number;
  playerId: string;
  name: string;
  team: string;
  value: number;
  gamesPlayed: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const statCategories = [
  { key: "ppg", label: "Points", unit: "PPG" },
  { key: "rpg", label: "Rebounds", unit: "RPG" },
  { key: "apg", label: "Assists", unit: "APG" },
  { key: "spg", label: "Steals", unit: "SPG" },
];

export default function StatsPage() {
  const [selectedStat, setSelectedStat] = useState("ppg");

  // Fetch all stat categories
  const { data: ppgData, isLoading: ppgLoading } = useSWR<{
    success: boolean;
    leaders: PlayerStat[];
  }>("/api/stats/leaders?category=ppg&limit=5", fetcher);

  const { data: rpgData, isLoading: rpgLoading } = useSWR<{
    success: boolean;
    leaders: PlayerStat[];
  }>("/api/stats/leaders?category=rpg&limit=5", fetcher);

  const { data: apgData, isLoading: apgLoading } = useSWR<{
    success: boolean;
    leaders: PlayerStat[];
  }>("/api/stats/leaders?category=apg&limit=5", fetcher);

  const { data: spgData, isLoading: spgLoading } = useSWR<{
    success: boolean;
    leaders: PlayerStat[];
  }>("/api/stats/leaders?category=spg&limit=5", fetcher);

  const leaders: Record<string, PlayerStat[]> = {
    ppg: ppgData?.leaders || [],
    rpg: rpgData?.leaders || [],
    apg: apgData?.leaders || [],
    spg: spgData?.leaders || [],
  };

  const isLoading = ppgLoading || rpgLoading || apgLoading || spgLoading;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-[var(--black)] flex flex-col">
        {/* Page Header */}
        <section className="bg-[var(--dark-gray)] py-6 md:py-8 border-b border-[var(--orange)]/30">
          <div className="container-main">
            <h1 className="font-[family-name:var(--font-anton)] text-3xl md:text-4xl tracking-wider text-white mb-2">
              LEAGUE LEADERS
            </h1>
            <p className="text-white/70">
              Top performers across all statistical categories
            </p>
          </div>
        </section>

        {/* Stats Content */}
        <section className="flex-1 py-6 md:py-8 flex min-h-0">
          <div className="container-main flex-1 flex flex-col min-h-0">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 mb-10">
              {statCategories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedStat(cat.key)}
                  className={cn(
                    "px-6 py-3 font-semibold uppercase tracking-wider transition-all",
                    selectedStat === cat.key
                      ? "bg-[var(--orange)] text-white"
                      : "bg-[var(--dark-gray)] text-white/60 hover:text-white"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Leaders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 flex-1">
              {statCategories.map((cat) => (
                <Card key={cat.key} variant="default" className="p-5 flex flex-col">
                  <h3 className="font-[family-name:var(--font-anton)] text-lg tracking-wider text-[var(--orange)] mb-4">
                    {cat.label.toUpperCase()} LEADERS
                  </h3>
                  <div className="space-y-3 flex-1 flex flex-col">
                    {isLoading ? (
                      // Loading skeleton
                      Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 bg-[var(--black)] animate-pulse"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-white/10 rounded" />
                            <div>
                              <div className="h-4 w-24 bg-white/10 rounded mb-1" />
                              <div className="h-3 w-12 bg-white/10 rounded" />
                            </div>
                          </div>
                          <div className="h-5 w-10 bg-white/10 rounded" />
                        </div>
                      ))
                    ) : leaders[cat.key].length === 0 ? (
                      <div className="flex-1 flex items-center justify-center">
                        <p className="text-white/30 text-sm">No data available</p>
                      </div>
                    ) : (
                      leaders[cat.key].map((player) => (
                        <div
                          key={player.playerId || player.rank}
                          className={cn(
                            "flex items-center justify-between p-3",
                            player.rank === 1
                              ? "bg-[var(--orange)]/10"
                              : "bg-[var(--black)]"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={cn(
                                "w-6 h-6 flex items-center justify-center text-xs font-bold",
                                player.rank === 1
                                  ? "bg-[var(--orange)] text-white"
                                  : "bg-[var(--gray)] text-white/60"
                              )}
                            >
                              {player.rank}
                            </span>
                            <div>
                              <p className="text-white text-sm font-semibold">
                                {player.name}
                              </p>
                              <p className="text-white/50 text-xs">{player.team}</p>
                            </div>
                          </div>
                          <span className="font-[family-name:var(--font-roboto-mono)] text-white font-bold">
                            {player.value}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
