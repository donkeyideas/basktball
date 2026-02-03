"use client";

import { useState } from "react";
import useSWR from "swr";
import { Header, Footer } from "@/components/layout";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  jerseyNum: number | null;
  headshotUrl: string | null;
  ppg: number;
  rpg: number;
  apg: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PlayersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [positionFilter, setPositionFilter] = useState("ALL");

  const { data, isLoading } = useSWR<{ success: boolean; players: Player[] }>(
    "/api/players",
    fetcher
  );

  const positions = ["ALL", "PG", "SG", "SF", "PF", "C"];
  const players = data?.players || [];

  const filteredPlayers = players.filter((player) => {
    const matchesSearch =
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.team.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPosition =
      positionFilter === "ALL" || player.position === positionFilter;
    return matchesSearch && matchesPosition;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-[var(--black)] flex flex-col">
        {/* Page Header */}
        <section className="bg-[var(--dark-gray)] py-6 md:py-8 border-b border-[var(--orange)]/30 mb-6 md:mb-8">
          <div className="container-main">
            <h1 className="font-[family-name:var(--font-anton)] text-3xl md:text-4xl tracking-wider text-white mb-2">
              PLAYERS
            </h1>
            <p className="text-white/70">
              Browse player profiles and statistics
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="py-4 md:py-6 border-b border-[var(--border)] mb-8 md:mb-12">
          <div className="container-main">
            <div className="flex flex-wrap items-center gap-4">
              <input
                type="text"
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[var(--dark-gray)] border-2 border-[var(--border)] text-white px-4 py-2 focus:border-[var(--orange)] outline-none flex-1 min-w-[200px]"
              />
              <div className="flex gap-1">
                {positions.map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setPositionFilter(pos)}
                    className={cn(
                      "px-3 py-2 text-sm font-semibold transition-colors",
                      positionFilter === pos
                        ? "bg-[var(--orange)] text-white"
                        : "bg-[var(--dark-gray)] text-white/60 hover:text-white"
                    )}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Players Grid */}
        <section className="flex-1 py-8 md:py-12">
          <div className="container-main">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Card key={i} variant="default" className="p-4 md:p-5 animate-pulse">
                    <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-3 bg-white/10 rounded-full" />
                    <div className="h-4 bg-white/10 rounded mb-2" />
                    <div className="h-3 bg-white/10 rounded w-2/3 mx-auto" />
                  </Card>
                ))}
              </div>
            ) : filteredPlayers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/50 text-lg">No players found</p>
                <p className="text-white/30 text-sm mt-2">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {filteredPlayers.map((player) => (
                  <Card
                    key={player.id}
                    variant="default"
                    hover
                    className="p-4 md:p-5 text-center"
                  >
                    <div
                      className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-3 bg-cover bg-top rounded-full border-2 border-[var(--orange)] bg-[var(--dark-gray)]"
                      style={{
                        backgroundImage: player.headshotUrl
                          ? `url('${player.headshotUrl}')`
                          : undefined,
                      }}
                    >
                      {!player.headshotUrl && (
                        <div className="w-full h-full flex items-center justify-center text-white/30 text-2xl">
                          {player.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-white text-sm mb-1 truncate">
                      {player.name}
                    </h3>
                    <p className="text-white/50 text-xs mb-2">
                      {player.team} • #{player.jerseyNum || "-"} •{" "}
                      {player.position || "-"}
                    </p>
                    <div className="flex justify-center gap-3 text-xs">
                      <div>
                        <p className="text-[var(--orange)] font-bold">
                          {player.ppg?.toFixed(1) || "0.0"}
                        </p>
                        <p className="text-white/40">PPG</p>
                      </div>
                      <div>
                        <p className="text-white font-bold">
                          {player.rpg?.toFixed(1) || "0.0"}
                        </p>
                        <p className="text-white/40">RPG</p>
                      </div>
                      <div>
                        <p className="text-white font-bold">
                          {player.apg?.toFixed(1) || "0.0"}
                        </p>
                        <p className="text-white/40">APG</p>
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
