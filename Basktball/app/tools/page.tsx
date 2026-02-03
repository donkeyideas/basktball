"use client";

import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const tools = [
  {
    id: "shot-chart",
    name: "SHOT CHART ANALYZER",
    description: "Visualize player shooting patterns with heat maps, zone breakdowns, and efficiency metrics across all court positions.",
    href: "/tools/shot-chart",
    features: ["Heat Maps", "Zone Data", "Efficiency"],
  },
  {
    id: "compare",
    name: "PLAYER COMPARISON",
    description: "Compare any players across any era with advanced stats, career trajectories, and head-to-head matchups.",
    href: "/tools/compare",
    features: ["Multi-Player", "Career Stats", "Era Adjusted"],
  },
  {
    id: "advanced-metrics",
    name: "ADVANCED METRICS",
    description: "Deep dive into PER, Win Shares, True Shooting %, VORP, BPM, and 50+ proprietary analytics metrics.",
    href: "/tools/advanced-metrics",
    features: ["50+ Metrics", "Real-Time", "Custom Formulas"],
  },
  {
    id: "predictor",
    name: "GAME PREDICTOR",
    description: "AI-powered predictions for game outcomes, player performance, and playoff probabilities using machine learning.",
    href: "/tools/predictor",
    features: ["ML Powered", "Predictions", "Probability"],
  },
  {
    id: "fantasy",
    name: "FANTASY OPTIMIZER",
    description: "Optimize DFS lineups with projected points, value picks, and matchup analysis for all major fantasy platforms.",
    href: "/tools/fantasy",
    features: ["DFS Tools", "Value Picks", "Projections"],
  },
  {
    id: "betting",
    name: "BETTING INSIGHTS",
    description: "Statistical edges, line movement tracking, and data-driven betting recommendations with historical accuracy analysis.",
    href: "/tools/betting",
    features: ["Odds Data", "Line Movement", "Edge Finder"],
  },
];

export default function ToolsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-[var(--black)] flex flex-col">
        {/* Page Header */}
        <section className="bg-[var(--dark-gray)] py-6 md:py-8 border-b border-[var(--orange)]/30">
          <div className="container-main">
            <h1 className="font-[family-name:var(--font-anton)] text-3xl md:text-4xl tracking-wider text-white mb-2">
              ANALYTICS TOOLS
            </h1>
            <p className="text-white/70">
              Professional-grade basketball analytics at your fingertips
            </p>
          </div>
        </section>

        {/* Tools Grid */}
        <section className="flex-1 py-8 md:py-12 flex min-h-0">
          <div className="container-main flex-1 flex flex-col min-h-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 grid-rows-6 md:grid-rows-3 lg:grid-rows-2 gap-6 flex-1 min-h-0">
              {tools.map((tool) => (
                <Card key={tool.id} variant="bordered" hover className="p-8 md:p-10 flex flex-col">
                  <h3 className="font-[family-name:var(--font-anton)] text-2xl md:text-3xl tracking-wider mb-6 text-[var(--orange)]">
                    {tool.name}
                  </h3>
                  <p className="text-white/70 text-base md:text-lg mb-8 leading-relaxed flex-1">
                    {tool.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {tool.features.map((feature) => (
                      <span
                        key={feature}
                        className="text-sm bg-[var(--orange)]/20 text-[var(--orange)] px-4 py-2"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                  <Link href={tool.href}>
                    <Button variant="primary" size="md" className="w-full text-lg py-4">
                      LAUNCH TOOL
                    </Button>
                  </Link>
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
