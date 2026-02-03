"use client";

import { useState } from "react";
import useSWR from "swr";
import { Header, Footer } from "@/components/layout";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface Team {
  id: string;
  name: string;
  abbreviation: string;
  logoUrl: string | null;
  league: string;
  wins: number;
  losses: number;
  winPct: number;
  conference: string | null;
  division: string | null;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const leagues = ["NBA", "WNBA", "NCAAM", "EURO"];

export default function TeamsPage() {
  const [leagueFilter, setLeagueFilter] = useState("NBA");
  const [conferenceFilter, setConferenceFilter] = useState("ALL");

  const { data, isLoading } = useSWR<{ success: boolean; teams: Team[] }>(
    `/api/teams?league=${leagueFilter}`,
    fetcher
  );

  const teams = data?.teams || [];

  const filteredTeams = teams
    .filter(
      (team) => conferenceFilter === "ALL" || team.conference === conferenceFilter
    )
    .sort((a, b) => b.winPct - a.winPct);

  // Get conference options based on selected league
  const getConferenceOptions = () => {
    if (leagueFilter === "NBA") return ["ALL", "East", "West"];
    if (leagueFilter === "WNBA") return ["ALL", "East", "West"];
    return ["ALL"];
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-[var(--black)] flex flex-col">
        {/* Page Header */}
        <section className="bg-[var(--dark-gray)] py-6 md:py-8 border-b border-[var(--orange)]/30 mb-6 md:mb-8">
          <div className="container-main">
            <h1 className="font-[family-name:var(--font-anton)] text-3xl md:text-4xl tracking-wider text-white mb-2">
              TEAMS
            </h1>
            <p className="text-white/70">
              Team standings across NBA, WNBA, NCAA & EuroLeague
            </p>
          </div>
        </section>

        {/* League & Conference Filters */}
        <section className="py-4 md:py-6 border-b border-[var(--border)] mb-8 md:mb-12">
          <div className="container-main">
            {/* League Filter */}
            <div className="flex flex-wrap gap-2 mb-4">
              {leagues.map((league) => (
                <button
                  key={league}
                  onClick={() => {
                    setLeagueFilter(league);
                    setConferenceFilter("ALL");
                  }}
                  className={cn(
                    "px-6 py-2 font-semibold uppercase tracking-wider transition-colors",
                    leagueFilter === league
                      ? "bg-[var(--orange)] text-white"
                      : "bg-[var(--dark-gray)] text-white/60 hover:text-white"
                  )}
                >
                  {league}
                </button>
              ))}
            </div>
            {/* Conference Filter (only for NBA/WNBA) */}
            {(leagueFilter === "NBA" || leagueFilter === "WNBA") && (
              <div className="flex gap-2">
                {getConferenceOptions().map((conf) => (
                  <button
                    key={conf}
                    onClick={() => setConferenceFilter(conf)}
                    className={cn(
                      "px-4 py-1.5 text-sm font-semibold uppercase tracking-wider transition-colors",
                      conferenceFilter === conf
                        ? "bg-white/20 text-white"
                        : "bg-transparent text-white/50 hover:text-white"
                    )}
                  >
                    {conf === "ALL" ? "All" : `${conf}ern`}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Teams Grid */}
        <section className="flex-1 py-8 md:py-12">
          <div className="container-main h-full">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} variant="default" className="p-5 md:p-6 animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-white/10 rounded" />
                      <div className="flex-1">
                        <div className="h-5 bg-white/10 rounded mb-2" />
                        <div className="h-3 bg-white/10 rounded w-1/2 mb-3" />
                        <div className="h-6 bg-white/10 rounded w-1/3" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : filteredTeams.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/50 text-lg">No teams found</p>
                <p className="text-white/30 text-sm mt-2">
                  Try selecting a different league
                </p>
              </div>
            ) : (
              <div
                className={cn(
                  "grid gap-4 md:gap-6",
                  filteredTeams.length <= 12
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                )}
              >
                {filteredTeams.map((team, index) => (
                  <Card key={team.id} variant="default" hover className="p-5 md:p-6">
                    <div className="flex items-center gap-4">
                      <div className="relative flex-shrink-0">
                        <span className="absolute -top-2 -left-2 w-7 h-7 bg-[var(--orange)] text-white text-xs font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        {team.logoUrl ? (
                          <img
                            src={team.logoUrl}
                            alt={team.name}
                            className="w-20 h-20 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://via.placeholder.com/80/1a1a1a/F47B20?text=${team.abbreviation}`;
                            }}
                          />
                        ) : (
                          <div className="w-20 h-20 bg-[var(--dark-gray)] flex items-center justify-center text-[var(--orange)] font-bold text-xl">
                            {team.abbreviation}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-base truncate">
                          {team.name}
                        </h3>
                        <p className="text-white/50 text-xs mt-0.5">
                          {team.conference && team.division
                            ? `${team.conference}ern • ${team.division}`
                            : team.league}
                        </p>
                        <div className="flex items-center gap-3 mt-3">
                          <span className="font-[family-name:var(--font-roboto-mono)] text-xl font-bold text-white">
                            {team.wins}-{team.losses}
                          </span>
                          <span className="text-white/50 text-sm">
                            ({(team.winPct * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
