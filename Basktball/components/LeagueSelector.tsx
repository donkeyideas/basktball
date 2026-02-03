"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

export type League = "nba" | "wnba" | "ncaam" | "ncaaw" | "euro" | "intl";

interface LeagueInfo {
  id: League;
  name: string;
  subtitle: string;
  logoPlaceholder: string;
}

const leagues: LeagueInfo[] = [
  { id: "nba", name: "NBA", subtitle: "Professional", logoPlaceholder: "NBA" },
  { id: "wnba", name: "WNBA", subtitle: "Professional", logoPlaceholder: "WNBA" },
  { id: "ncaam", name: "NCAA M", subtitle: "College Men's", logoPlaceholder: "M" },
  { id: "ncaaw", name: "NCAA W", subtitle: "College Women's", logoPlaceholder: "W" },
  { id: "euro", name: "EURO", subtitle: "EuroLeague", logoPlaceholder: "EU" },
  { id: "intl", name: "INTL", subtitle: "International", logoPlaceholder: "INTL" },
];

interface LeagueSelectorProps {
  selectedLeague?: League;
  onLeagueChange?: (league: League) => void;
}

export function LeagueSelector({
  selectedLeague: controlledLeague,
  onLeagueChange,
}: LeagueSelectorProps) {
  const [internalLeague, setInternalLeague] = useState<League>("nba");
  const selectedLeague = controlledLeague ?? internalLeague;

  const handleLeagueSelect = (league: League) => {
    if (onLeagueChange) {
      onLeagueChange(league);
    } else {
      setInternalLeague(league);
    }
  };

  return (
    <div className="relative z-10 bg-[var(--dark-gray)] py-6 md:py-8 border-b border-[var(--orange)]/30">
      <div className="container-main">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
          {leagues.map((league, index) => (
            <button
              key={league.id}
              onClick={() => handleLeagueSelect(league.id)}
              className={cn(
                "relative bg-[var(--black)] border-3 p-4 md:p-6 text-center",
                "transition-all duration-300 overflow-hidden",
                "animate-slide-up",
                selectedLeague === league.id
                  ? "bg-[var(--orange)] border-[var(--orange)]"
                  : "border-[var(--border)] hover:border-[var(--orange)] hover:translate-y-[-5px] hover:scale-105 hover:shadow-[0_10px_30px_rgba(244,123,32,0.3)]"
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Background gradient on hover */}
              <div
                className={cn(
                  "absolute inset-0 opacity-0 transition-opacity duration-300",
                  "bg-gradient-to-br from-transparent to-[rgba(244,123,32,0.1)]",
                  selectedLeague !== league.id && "group-hover:opacity-100"
                )}
              />

              {/* League Logo Placeholder */}
              <div
                className={cn(
                  "w-12 h-12 md:w-16 md:h-16 mx-auto mb-2 md:mb-3",
                  "flex items-center justify-center",
                  "text-2xl md:text-3xl font-bold",
                  "transition-all duration-300",
                  selectedLeague === league.id
                    ? "text-white scale-110"
                    : "text-white/80"
                )}
              >
                {league.logoPlaceholder}
              </div>

              {/* League Name */}
              <h3
                className={cn(
                  "font-[family-name:var(--font-anton)] text-xl md:text-2xl tracking-wider mb-1",
                  selectedLeague === league.id ? "text-white" : "text-white"
                )}
              >
                {league.name}
              </h3>

              {/* Subtitle */}
              <p
                className={cn(
                  "text-xs font-semibold uppercase tracking-wider",
                  selectedLeague === league.id
                    ? "text-white/80"
                    : "text-white/60"
                )}
              >
                {league.subtitle}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
