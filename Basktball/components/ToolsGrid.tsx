"use client";

import { Card, Badge } from "@/components/ui";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Tool {
  id: string;
  number: string;
  name: string;
  description: string;
  href: string;
  features: string[];
}

const tools: Tool[] = [
  {
    id: "shot",
    number: "1",
    name: "SHOT CHART ANALYZER",
    description:
      "Visualize player shooting patterns with heat maps, zone breakdowns, and efficiency metrics across all court positions.",
    href: "/tools/shot-chart",
    features: ["HEAT MAPS", "ZONE DATA", "EFFICIENCY"],
  },
  {
    id: "compare",
    number: "2",
    name: "PLAYER COMPARISON",
    description:
      "Compare any players across any era with advanced stats, career trajectories, and head-to-head matchups.",
    href: "/tools/compare",
    features: ["MULTI-PLAYER", "CAREER STATS", "ERA ADJUSTED"],
  },
  {
    id: "metrics",
    number: "3",
    name: "ADVANCED METRICS",
    description:
      "Deep dive into PER, Win Shares, True Shooting %, VORP, BPM, and 50+ proprietary analytics metrics.",
    href: "/tools/advanced-metrics",
    features: ["50+ METRICS", "REAL-TIME", "CUSTOM FORMULAS"],
  },
  {
    id: "predict",
    number: "4",
    name: "GAME PREDICTOR",
    description:
      "AI-powered predictions for game outcomes, player performance, and playoff probabilities using machine learning.",
    href: "/tools/predictor",
    features: ["ML POWERED", "PREDICTIONS", "PROBABILITY"],
  },
  {
    id: "fantasy",
    number: "5",
    name: "FANTASY OPTIMIZER",
    description:
      "Optimize DFS lineups with projected points, value picks, and matchup analysis for all major fantasy platforms.",
    href: "/tools/fantasy",
    features: ["DFS TOOLS", "VALUE PICKS", "PROJECTIONS"],
  },
  {
    id: "betting",
    number: "6",
    name: "BETTING INSIGHTS",
    description:
      "Statistical edges, line movement tracking, and data-driven betting recommendations with historical accuracy.",
    href: "/tools/betting",
    features: ["ODDS DATA", "TRENDS", "EDGES"],
  },
];

function ToolCard({ tool, index }: { tool: Tool; index: number }) {
  return (
    <Link href={tool.href}>
      <Card
        variant="bordered"
        hover
        className={cn(
          "p-6 md:p-8 h-full",
          "group",
          "animate-slide-up"
        )}
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        {/* Content */}
        <div className="relative z-10">
          {/* Title with Number */}
          <div className="flex items-start gap-3 mb-3">
            <span className="bg-[var(--orange)] text-white font-[family-name:var(--font-roboto-mono)] text-lg font-bold px-3 py-1 flex-shrink-0">
              {tool.number}
            </span>
            <h3 className="font-[family-name:var(--font-anton)] text-xl md:text-2xl tracking-wider uppercase">
              {tool.name}
            </h3>
          </div>

          <p className="text-sm md:text-base text-white/80 leading-relaxed mb-4">
            {tool.description}
          </p>

          {/* Features */}
          <div className="flex flex-wrap gap-2">
            {tool.features.map((feature) => (
              <Badge key={feature} variant="feature">
                {feature}
              </Badge>
            ))}
          </div>
        </div>

        {/* Hover Accent Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--orange)] to-[var(--orange-bright)] transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100" />
      </Card>
    </Link>
  );
}

export function ToolsGrid() {
  return (
    <section className="relative z-10 w-full">
      {/* Section Header */}
      <div className="flex items-center gap-4 mb-8 md:mb-12 pb-4 border-b-3 border-[var(--orange)]">
        <h2 className="font-[family-name:var(--font-anton)] text-3xl md:text-4xl lg:text-5xl tracking-wider uppercase text-white">
          ANALYTICS TOOLS
        </h2>
        <div className="flex-1 h-1 bg-gradient-to-r from-[var(--orange)] to-transparent" />
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {tools.map((tool, index) => (
          <ToolCard key={tool.id} tool={tool} index={index} />
        ))}
      </div>
    </section>
  );
}
