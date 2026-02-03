"use client";

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
    number: "01",
    name: "SHOT CHART ANALYZER",
    description:
      "Visualize player shooting patterns with heat maps, zone breakdowns, and efficiency metrics across all court positions.",
    href: "/tools/shot-chart",
    features: ["HEAT MAPS", "ZONE DATA", "EFFICIENCY"],
  },
  {
    id: "compare",
    number: "02",
    name: "PLAYER COMPARISON",
    description:
      "Compare any players across any era with advanced stats, career trajectories, and head-to-head matchups.",
    href: "/tools/compare",
    features: ["MULTI-PLAYER", "CAREER STATS", "ERA ADJUSTED"],
  },
  {
    id: "metrics",
    number: "03",
    name: "ADVANCED METRICS",
    description:
      "Deep dive into PER, Win Shares, True Shooting %, VORP, BPM, and 50+ proprietary analytics metrics.",
    href: "/tools/advanced-metrics",
    features: ["50+ METRICS", "REAL-TIME", "CUSTOM FORMULAS"],
  },
  {
    id: "predict",
    number: "04",
    name: "GAME PREDICTOR",
    description:
      "AI-powered predictions for game outcomes, player performance, and playoff probabilities using machine learning.",
    href: "/tools/predictor",
    features: ["ML POWERED", "PREDICTIONS", "PROBABILITY"],
  },
  {
    id: "fantasy",
    number: "05",
    name: "FANTASY OPTIMIZER",
    description:
      "Optimize DFS lineups with projected points, value picks, and matchup analysis for all major fantasy platforms.",
    href: "/tools/fantasy",
    features: ["DFS TOOLS", "VALUE PICKS", "PROJECTIONS"],
  },
  {
    id: "team",
    number: "06",
    name: "TEAM ANALYTICS",
    description:
      "Comprehensive team stats including pace, offensive/defensive ratings, four factors, and lineup combinations.",
    href: "/tools/team-analytics",
    features: ["TEAM STATS", "LINEUPS", "PACE DATA"],
  },
  {
    id: "betting",
    number: "07",
    name: "BETTING INSIGHTS",
    description:
      "Statistical edges, line movement tracking, and data-driven betting recommendations with historical accuracy.",
    href: "/tools/betting",
    features: ["ODDS DATA", "TRENDS", "EDGES"],
  },
  {
    id: "draft",
    number: "08",
    name: "DRAFT ANALYZER",
    description:
      "College-to-pro projections, prospect comparisons, and historical draft class analysis with scouting reports.",
    href: "/tools/draft",
    features: ["PROSPECTS", "PROJECTIONS", "SCOUTING"],
  },
  {
    id: "history",
    number: "09",
    name: "HISTORICAL DATABASE",
    description:
      "Query decades of basketball data with advanced filters, play-by-play analysis, and downloadable datasets.",
    href: "/tools/history",
    features: ["ARCHIVES", "PLAY-BY-PLAY", "EXPORT"],
  },
];

function ToolCard({ tool, index }: { tool: Tool; index: number }) {
  return (
    <Link href={tool.href}>
      <div
        className={cn("tool-card group", "animate-slide-up")}
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        {/* Number Badge */}
        <div className="tool-number">{tool.number}</div>

        {/* Content */}
        <div className="relative z-10">
          <h3 className="font-[family-name:var(--font-anton)] text-xl md:text-2xl tracking-wider uppercase mb-3 mt-4">
            {tool.name}
          </h3>

          <p className="text-sm md:text-base text-white/80 leading-relaxed mb-4">
            {tool.description}
          </p>

          {/* Features */}
          <div className="flex flex-wrap gap-2">
            {tool.features.map((feature) => (
              <span key={feature} className="feature-tag">
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* Background Image Overlay */}
        <div
          className="absolute top-0 right-0 bottom-0 w-[200px] opacity-[0.08] grayscale transition-opacity group-hover:opacity-[0.15]"
          style={{
            backgroundImage:
              "url('https://cdn.nba.com/manage/2021/10/GettyImages-1340187444.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* Hover Accent Line */}
        <div className="absolute top-0 left-0 w-full h-[5px] bg-gradient-to-r from-[var(--orange)] to-[var(--orange-bright)] transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100" />
      </div>
    </Link>
  );
}

export function ToolsGrid() {
  return (
    <section className="relative z-10 w-full">
      {/* Section Header */}
      <div className="section-header mb-12">
        <h2 className="font-[family-name:var(--font-anton)] text-3xl md:text-4xl lg:text-[3.5rem] tracking-[3px] uppercase text-white">
          ANALYTICS TOOLS
        </h2>
      </div>

      {/* Tools Grid */}
      <div className="tools-grid">
        {tools.map((tool, index) => (
          <ToolCard key={tool.id} tool={tool} index={index} />
        ))}
      </div>
    </section>
  );
}
