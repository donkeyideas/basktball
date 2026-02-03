"use client";

import { useState } from "react";
import { Header, Footer } from "@/components/layout";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface BettingLine {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeSpread: number;
  awaySpread: number;
  homeOdds: number;
  awayOdds: number;
  overUnder: number;
  gameTime: string;
  edge: number;
  recommendation: "HOME" | "AWAY" | "OVER" | "UNDER" | "PASS";
  confidence: number;
}

const mockBettingLines: BettingLine[] = [
  { id: "1", homeTeam: "BOS", awayTeam: "MIA", homeSpread: -7.5, awaySpread: 7.5, homeOdds: -110, awayOdds: -110, overUnder: 218.5, gameTime: "7:30 PM ET", edge: 3.2, recommendation: "HOME", confidence: 72 },
  { id: "2", homeTeam: "LAL", awayTeam: "GSW", homeSpread: -2.5, awaySpread: 2.5, homeOdds: -105, awayOdds: -115, overUnder: 232.0, gameTime: "10:00 PM ET", edge: 2.8, recommendation: "OVER", confidence: 68 },
  { id: "3", homeTeam: "DEN", awayTeam: "PHX", homeSpread: -5.0, awaySpread: 5.0, homeOdds: -110, awayOdds: -110, overUnder: 224.5, gameTime: "9:00 PM ET", edge: 4.1, recommendation: "HOME", confidence: 75 },
  { id: "4", homeTeam: "MIL", awayTeam: "CLE", homeSpread: -3.5, awaySpread: 3.5, homeOdds: -108, awayOdds: -112, overUnder: 221.0, gameTime: "8:00 PM ET", edge: 1.5, recommendation: "PASS", confidence: 52 },
  { id: "5", homeTeam: "DAL", awayTeam: "OKC", homeSpread: 1.5, awaySpread: -1.5, homeOdds: -110, awayOdds: -110, overUnder: 228.5, gameTime: "8:30 PM ET", edge: 3.8, recommendation: "AWAY", confidence: 71 },
  { id: "6", homeTeam: "NYK", awayTeam: "PHI", homeSpread: -4.0, awaySpread: 4.0, homeOdds: -110, awayOdds: -110, overUnder: 215.0, gameTime: "7:00 PM ET", edge: 2.1, recommendation: "UNDER", confidence: 65 },
];

const stats = [
  { label: "Win Rate", value: "58.3%", trend: "+2.1%" },
  { label: "ROI", value: "+12.4%", trend: "+1.8%" },
  { label: "Units Won", value: "+47.2", trend: "+8.5" },
  { label: "Best Streak", value: "8W", trend: "Current" },
];

export default function BettingToolPage() {
  const [selectedFilter, setSelectedFilter] = useState("ALL");

  const filters = ["ALL", "SPREAD", "TOTALS", "MONEYLINE"];

  const filteredLines = mockBettingLines.filter((line) => {
    if (selectedFilter === "ALL") return true;
    if (selectedFilter === "SPREAD") return line.recommendation === "HOME" || line.recommendation === "AWAY";
    if (selectedFilter === "TOTALS") return line.recommendation === "OVER" || line.recommendation === "UNDER";
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-[var(--black)] flex flex-col">
        {/* Page Header */}
        <section className="bg-[var(--dark-gray)] py-6 md:py-8 border-b border-[var(--orange)]/30">
          <div className="container-main">
            <h1 className="font-[family-name:var(--font-anton)] text-3xl md:text-4xl tracking-wider text-white mb-2">
              BETTING INSIGHTS
            </h1>
            <p className="text-white/70">
              Data-driven betting recommendations with statistical edge analysis
            </p>
          </div>
        </section>

        {/* Stats Overview */}
        <section className="py-6 border-b border-[var(--border)]">
          <div className="container-main">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <Card key={stat.label} variant="default" className="p-4 text-center">
                  <p className="text-white/50 text-xs uppercase mb-1">{stat.label}</p>
                  <p className="font-[family-name:var(--font-roboto-mono)] text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-[var(--orange)] text-xs">{stat.trend}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="py-4 border-b border-[var(--border)]">
          <div className="container-main">
            <div className="flex gap-2">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={cn(
                    "px-4 py-2 text-sm font-semibold uppercase tracking-wider transition-colors",
                    selectedFilter === filter
                      ? "bg-[var(--orange)] text-white"
                      : "bg-[var(--dark-gray)] text-white/60 hover:text-white"
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Betting Lines */}
        <section className="flex-1 py-6 md:py-8 flex min-h-0">
          <div className="container-main flex-1 flex flex-col min-h-0">
            <div className="space-y-4 flex-1 flex flex-col">
              {filteredLines.map((line) => (
                <Card key={line.id} variant="bordered" className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Teams */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between md:justify-start md:gap-8 mb-2">
                        <div className="text-center md:text-left">
                          <p className="font-semibold text-white text-lg">{line.awayTeam}</p>
                          <p className="text-white/50 text-sm">
                            {line.awaySpread > 0 ? "+" : ""}{line.awaySpread} ({line.awayOdds > 0 ? "+" : ""}{line.awayOdds})
                          </p>
                        </div>
                        <span className="text-white/30 text-sm">@</span>
                        <div className="text-center md:text-left">
                          <p className="font-semibold text-white text-lg">{line.homeTeam}</p>
                          <p className="text-white/50 text-sm">
                            {line.homeSpread > 0 ? "+" : ""}{line.homeSpread} ({line.homeOdds > 0 ? "+" : ""}{line.homeOdds})
                          </p>
                        </div>
                      </div>
                      <p className="text-white/40 text-xs">{line.gameTime} | O/U {line.overUnder}</p>
                    </div>

                    {/* Edge & Recommendation */}
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-white/50 text-xs uppercase mb-1">Edge</p>
                        <p className={cn(
                          "font-[family-name:var(--font-roboto-mono)] text-lg font-bold",
                          line.edge >= 3 ? "text-green-500" : line.edge >= 2 ? "text-yellow-500" : "text-white/50"
                        )}>
                          {line.edge.toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-white/50 text-xs uppercase mb-1">Confidence</p>
                        <p className="font-[family-name:var(--font-roboto-mono)] text-lg font-bold text-white">
                          {line.confidence}%
                        </p>
                      </div>
                      <div className={cn(
                        "px-4 py-2 font-bold text-sm uppercase",
                        line.recommendation === "PASS"
                          ? "bg-white/10 text-white/50"
                          : "bg-[var(--orange)] text-white"
                      )}>
                        {line.recommendation}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Disclaimer */}
            <p className="text-white/30 text-xs text-center mt-8">
              For entertainment purposes only. Please gamble responsibly.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
