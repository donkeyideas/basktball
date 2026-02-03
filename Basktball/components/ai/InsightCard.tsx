"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";

export type InsightType =
  | "GAME_RECAP"
  | "PLAYER_ANALYSIS"
  | "BETTING"
  | "FANTASY"
  | "TRENDING";

interface InsightCardProps {
  type: InsightType;
  title?: string;
  content: string;
  meta?: {
    playerName?: string;
    teamName?: string;
    gameInfo?: string;
    generatedAt?: string;
    confidence?: number;
  };
  className?: string;
}

const TYPE_CONFIG: Record<
  InsightType,
  { label: string; icon: string; color: string }
> = {
  GAME_RECAP: {
    label: "GAME RECAP",
    icon: "📊",
    color: "text-blue-400",
  },
  PLAYER_ANALYSIS: {
    label: "PLAYER ANALYSIS",
    icon: "🏀",
    color: "text-green-400",
  },
  BETTING: {
    label: "BETTING INSIGHTS",
    icon: "💰",
    color: "text-yellow-400",
  },
  FANTASY: {
    label: "FANTASY TIPS",
    icon: "⭐",
    color: "text-purple-400",
  },
  TRENDING: {
    label: "TRENDING",
    icon: "🔥",
    color: "text-[var(--orange)]",
  },
};

export function InsightCard({
  type,
  title,
  content,
  meta,
  className,
}: InsightCardProps) {
  const config = TYPE_CONFIG[type];

  return (
    <Card
      variant="default"
      hover
      className={cn("p-5 md:p-6", className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{config.icon}</span>
          <span
            className={cn(
              "text-xs font-bold uppercase tracking-wider",
              config.color
            )}
          >
            {config.label}
          </span>
        </div>
        {meta?.confidence !== undefined && (
          <div className="flex items-center gap-1">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                meta.confidence >= 0.8
                  ? "bg-green-500"
                  : meta.confidence >= 0.6
                    ? "bg-yellow-500"
                    : "bg-red-500"
              )}
            />
            <span className="text-xs text-white/50">
              {Math.round(meta.confidence * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Title */}
      {title && (
        <h3 className="font-[family-name:var(--font-anton)] text-lg md:text-xl tracking-wider mb-3 text-white">
          {title}
        </h3>
      )}

      {/* Meta Info */}
      {(meta?.playerName || meta?.gameInfo) && (
        <div className="flex flex-wrap gap-2 mb-3">
          {meta.playerName && (
            <span className="text-xs bg-white/10 px-2 py-1 rounded text-white/80">
              {meta.playerName}
              {meta.teamName && ` • ${meta.teamName}`}
            </span>
          )}
          {meta.gameInfo && (
            <span className="text-xs bg-white/10 px-2 py-1 rounded text-white/80">
              {meta.gameInfo}
            </span>
          )}
        </div>
      )}

      {/* Content */}
      <div className="text-sm md:text-base text-white/80 leading-relaxed whitespace-pre-wrap">
        {content}
      </div>

      {/* Footer */}
      {meta?.generatedAt && (
        <div className="mt-4 pt-3 border-t border-white/10">
          <span className="text-xs text-white/40">
            Generated {new Date(meta.generatedAt).toLocaleDateString()}
          </span>
        </div>
      )}
    </Card>
  );
}
