"use client";

import { useState } from "react";
import { Header, Footer } from "@/components/layout";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface PlayerStat {
  rank: number;
  name: string;
  team: string;
  value: number;
}

const mockLeaders: Record<string, PlayerStat[]> = {
  ppg: [
    { rank: 1, name: "Luka Doncic", team: "DAL", value: 33.9 },
    { rank: 2, name: "Giannis Antetokounmpo", team: "MIL", value: 31.1 },
    { rank: 3, name: "Shai Gilgeous-Alexander", team: "OKC", value: 30.1 },
    { rank: 4, name: "Joel Embiid", team: "PHI", value: 28.6 },
    { rank: 5, name: "Kevin Durant", team: "PHX", value: 27.1 },
  ],
  rpg: [
    { rank: 1, name: "Domantas Sabonis", team: "SAC", value: 13.7 },
    { rank: 2, name: "Rudy Gobert", team: "MIN", value: 12.9 },
    { rank: 3, name: "Nikola Jokic", team: "DEN", value: 12.4 },
    { rank: 4, name: "Anthony Davis", team: "LAL", value: 12.1 },
    { rank: 5, name: "Giannis Antetokounmpo", team: "MIL", value: 11.5 },
  ],
  apg: [
    { rank: 1, name: "Tyrese Haliburton", team: "IND", value: 10.9 },
    { rank: 2, name: "Luka Doncic", team: "DAL", value: 9.8 },
    { rank: 3, name: "Trae Young", team: "ATL", value: 9.5 },
    { rank: 4, name: "Nikola Jokic", team: "DEN", value: 9.0 },
    { rank: 5, name: "James Harden", team: "LAC", value: 8.5 },
  ],
  spg: [
    { rank: 1, name: "De'Aaron Fox", team: "SAC", value: 2.0 },
    { rank: 2, name: "OG Anunoby", team: "NYK", value: 1.7 },
    { rank: 3, name: "Shai Gilgeous-Alexander", team: "OKC", value: 1.6 },
    { rank: 4, name: "Matisse Thybulle", team: "POR", value: 1.5 },
    { rank: 5, name: "Alex Caruso", team: "CHI", value: 1.5 },
  ],
};

const statCategories = [
  { key: "ppg", label: "Points", unit: "PPG" },
  { key: "rpg", label: "Rebounds", unit: "RPG" },
  { key: "apg", label: "Assists", unit: "APG" },
  { key: "spg", label: "Steals", unit: "SPG" },
];

export default function StatsPage() {
  const [selectedStat, setSelectedStat] = useState("ppg");

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
                    {mockLeaders[cat.key].map((player) => (
                      <div
                        key={player.rank}
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
                    ))}
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
