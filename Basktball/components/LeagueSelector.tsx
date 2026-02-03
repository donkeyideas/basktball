"use client";

import { useState } from "react";

interface League {
  id: string;
  name: string;
  subtitle: string;
  icon: React.ReactNode;
}

const leagues: League[] = [
  {
    id: "nba",
    name: "NBA",
    subtitle: "National Basketball Association",
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
        <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
        <circle cx="12" cy="12" r="2"/>
      </svg>
    ),
  },
  {
    id: "wnba",
    name: "WNBA",
    subtitle: "Women's National Basketball",
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" stroke="currentColor" strokeWidth="1"/>
      </svg>
    ),
  },
  {
    id: "ncaam",
    name: "NCAA M",
    subtitle: "Men's College Basketball",
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" fill="none" stroke="currentColor" strokeWidth="2"/>
        <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    id: "ncaaw",
    name: "NCAA W",
    subtitle: "Women's College Basketball",
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" fill="none" stroke="currentColor" strokeWidth="2"/>
        <circle cx="12" cy="11" r="3" fill="none" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 14v4M10 16h4" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    id: "euro",
    name: "EURO",
    subtitle: "EuroLeague & EuroCup",
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 2c-2.5 5-2.5 15 0 20M2 12c5-2.5 15-2.5 20 0" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <circle cx="12" cy="12" r="3" fill="currentColor"/>
      </svg>
    ),
  },
  {
    id: "intl",
    name: "INTL",
    subtitle: "International Leagues",
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
        <ellipse cx="12" cy="12" rx="4" ry="10" fill="none" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M2 12h20" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M4 7h16M4 17h16" stroke="currentColor" strokeWidth="1"/>
      </svg>
    ),
  },
];

interface LeagueSelectorProps {
  onLeagueChange?: (leagueId: string) => void;
  defaultLeague?: string;
}

export function LeagueSelector({ onLeagueChange, defaultLeague = "nba" }: LeagueSelectorProps) {
  const [activeLeague, setActiveLeague] = useState(defaultLeague);

  const handleLeagueClick = (leagueId: string) => {
    setActiveLeague(leagueId);
    onLeagueChange?.(leagueId);
  };

  return (
    <section className="league-selector">
      <h2>SELECT YOUR LEAGUE</h2>
      <div className="league-grid">
        {leagues.map((league) => (
          <div
            key={league.id}
            className={`league-card ${activeLeague === league.id ? "active" : ""}`}
            onClick={() => handleLeagueClick(league.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                handleLeagueClick(league.id);
              }
            }}
          >
            <div className="league-logo" style={{
              background: "transparent",
              color: activeLeague === league.id ? "var(--white)" : "var(--orange)"
            }}>
              {league.icon}
            </div>
            <h3>{league.name}</h3>
            <p>{league.subtitle}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default LeagueSelector;
