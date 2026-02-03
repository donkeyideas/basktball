"use client";

import { cn } from "@/lib/utils";

interface PlayerStat {
  value: string;
  label: string;
}

interface FeaturedPlayer {
  id: string;
  name: string;
  imageUrl: string;
  stats: PlayerStat[];
}

const defaultPlayers: FeaturedPlayer[] = [
  {
    id: "1",
    name: "LUKA DONČIĆ",
    imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1629029.png",
    stats: [
      { value: "28.7", label: "PPG" },
      { value: "8.3", label: "RPG" },
      { value: "8.1", label: "APG" },
    ],
  },
  {
    id: "2",
    name: "GIANNIS",
    imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/203507.png",
    stats: [
      { value: "30.9", label: "PPG" },
      { value: "11.4", label: "RPG" },
      { value: "6.2", label: "APG" },
    ],
  },
  {
    id: "3",
    name: "LAMELO BALL",
    imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1630162.png",
    stats: [
      { value: "26.5", label: "PPG" },
      { value: "5.1", label: "RPG" },
      { value: "7.8", label: "APG" },
    ],
  },
];

interface FeaturedPlayersProps {
  players?: FeaturedPlayer[];
}

function PlayerCard({ player }: { player: FeaturedPlayer }) {
  return (
    <div className="text-center">
      {/* Player Image */}
      <div
        className={cn(
          "w-full max-w-[350px] h-[350px] md:h-[400px] mx-auto mb-4",
          "bg-cover bg-top",
          "border-4 border-white",
          "transition-transform duration-300 hover:scale-105",
          "animate-fade-scale"
        )}
        style={{ backgroundImage: `url('${player.imageUrl}')` }}
      />

      {/* Player Stats */}
      <div className="bg-black/30 backdrop-blur-sm p-4">
        <h3 className="font-[family-name:var(--font-anton)] text-xl md:text-2xl tracking-wider text-white mb-3">
          {player.name}
        </h3>

        <div className="flex justify-around">
          {player.stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="font-[family-name:var(--font-roboto-mono)] text-2xl md:text-3xl font-bold text-white">
                {stat.value}
              </div>
              <div className="text-xs uppercase tracking-wider text-white/80">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FeaturedPlayers({ players = defaultPlayers }: FeaturedPlayersProps) {
  return (
    <div className="relative z-10 bg-gradient-to-br from-[var(--orange)] to-[var(--orange-bright)] py-16 md:py-20 overflow-hidden">
      {/* Background Overlay */}
      <div
        className="absolute inset-0 opacity-20 bg-cover bg-center mix-blend-overlay"
        style={{
          backgroundImage: `url('https://cdn.nba.com/manage/2021/10/GettyImages-1340187444.jpg')`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 container-main">
        {/* Section Title */}
        <h2 className="font-[family-name:var(--font-anton)] text-3xl md:text-4xl tracking-wider text-white text-center mb-8 md:mb-12">
          FEATURED PLAYERS
        </h2>

        {/* Players Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {players.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>
      </div>
    </div>
  );
}
