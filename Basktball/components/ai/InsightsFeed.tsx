"use client";

import { useState, useEffect } from "react";
import { InsightCard, InsightType } from "./InsightCard";
import { cn } from "@/lib/utils";

interface Insight {
  id: string;
  type: InsightType;
  title?: string;
  content: string;
  confidence?: number;
  generatedAt: string;
  player?: {
    name: string;
    team?: {
      name: string;
      abbreviation: string;
    };
  };
  game?: {
    homeTeam: { name: string; abbreviation: string };
    awayTeam: { name: string; abbreviation: string };
    homeScore?: number;
    awayScore?: number;
    gameDate: string;
  };
}

interface InsightsFeedProps {
  type?: InsightType;
  limit?: number;
  className?: string;
  showFilters?: boolean;
}

const FILTER_OPTIONS: { value: InsightType | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "GAME_RECAP", label: "Recaps" },
  { value: "PLAYER_ANALYSIS", label: "Analysis" },
  { value: "BETTING", label: "Betting" },
  { value: "FANTASY", label: "Fantasy" },
  { value: "TRENDING", label: "Trending" },
];

export function InsightsFeed({
  type,
  limit = 10,
  className,
  showFilters = true,
}: InsightsFeedProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<InsightType | "ALL">(type || "ALL");

  useEffect(() => {
    async function fetchInsights() {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (filter !== "ALL") {
          params.set("type", filter);
        }
        params.set("limit", String(limit));

        const response = await fetch(`/api/ai/insights?${params}`);
        const data = await response.json();

        if (data.success) {
          setInsights(data.insights);
        } else {
          setError(data.error || "Failed to fetch insights");
        }
      } catch (err) {
        setError("Failed to load insights");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchInsights();
  }, [filter, limit]);

  const formatGameInfo = (game: Insight["game"]) => {
    if (!game) return undefined;
    const score =
      game.homeScore !== undefined
        ? ` (${game.awayScore}-${game.homeScore})`
        : "";
    return `${game.awayTeam.abbreviation} @ ${game.homeTeam.abbreviation}${score}`;
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={cn(
                "px-4 py-2 text-sm font-semibold uppercase tracking-wider transition-all",
                filter === option.value
                  ? "bg-[var(--orange)] text-white"
                  : "bg-[var(--dark-gray)] text-white/60 hover:text-white hover:bg-[var(--gray)]"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-[var(--dark-gray)] animate-pulse h-48 rounded"
            />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-center">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && insights.length === 0 && (
        <div className="text-center py-12 text-white/50">
          <p className="text-lg">No insights available</p>
          <p className="text-sm mt-2">
            AI-generated content will appear here once generated
          </p>
        </div>
      )}

      {/* Insights Grid */}
      {!isLoading && !error && insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {insights.map((insight) => (
            <InsightCard
              key={insight.id}
              type={insight.type}
              title={insight.title}
              content={insight.content}
              meta={{
                playerName: insight.player?.name,
                teamName: insight.player?.team?.abbreviation,
                gameInfo: formatGameInfo(insight.game),
                generatedAt: insight.generatedAt,
                confidence: insight.confidence,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
