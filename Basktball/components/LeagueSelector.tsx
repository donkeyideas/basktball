"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

export type League = "nba" | "wnba" | "ncaam" | "ncaaw" | "euro" | "intl";

interface LeagueInfo {
  id: League;
  name: string;
  subtitle: string;
}

const leagues: LeagueInfo[] = [
  { id: "nba", name: "NBA", subtitle: "Professional" },
  { id: "wnba", name: "WNBA", subtitle: "Professional" },
  { id: "ncaam", name: "NCAA M", subtitle: "College Men's" },
  { id: "ncaaw", name: "NCAA W", subtitle: "College Women's" },
  { id: "euro", name: "EURO", subtitle: "EuroLeague" },
  { id: "intl", name: "INTL", subtitle: "International" },
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

  const getLeagueLogo = (league: League) => {
    switch (league) {
      case "nba":
        return (
          <div
            className="league-logo"
            style={{ backgroundImage: "url('https://cdn.nba.com/logos/leagues/logo-nba.svg')" }}
          />
        );
      case "wnba":
        return (
          <div
            className="league-logo"
            style={{ backgroundImage: "url('https://cdn.nba.com/logos/leagues/logo-wnba.svg')" }}
          />
        );
      case "ncaam":
        return (
          <div className="league-logo flex items-center justify-center">
            <span className="text-4xl font-bold text-white">M</span>
          </div>
        );
      case "ncaaw":
        return (
          <div className="league-logo flex items-center justify-center">
            <span className="text-4xl font-bold text-white">W</span>
          </div>
        );
      case "euro":
        return (
          <div className="league-logo flex items-center justify-center">
            <span className="text-3xl font-bold text-white">EU</span>
          </div>
        );
      case "intl":
        return (
          <div className="league-logo flex items-center justify-center">
            <svg className="w-12 h-12" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="white" strokeWidth="4" />
              <circle cx="50" cy="50" r="30" fill="none" stroke="white" strokeWidth="2" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="relative z-10 bg-[var(--dark-gray)] py-8 border-b-2 border-[var(--orange)]/30">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 md:gap-6">
          {leagues.map((league, index) => (
            <button
              key={league.id}
              onClick={() => handleLeagueSelect(league.id)}
              className={cn(
                "league-card animate-slide-up",
                selectedLeague === league.id && "active"
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {getLeagueLogo(league.id)}
              <h3 className="font-[family-name:var(--font-anton)] text-2xl tracking-wider mb-1">
                {league.name}
              </h3>
              <p className="text-sm font-semibold uppercase tracking-wider opacity-70">
                {league.subtitle}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
