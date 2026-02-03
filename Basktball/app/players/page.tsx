"use client";

import { useState } from "react";
import { Header, Footer } from "@/components/layout";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  number: string;
  imageUrl: string;
  stats: {
    ppg: number;
    rpg: number;
    apg: number;
  };
}

const mockPlayers: Player[] = [
  // Row 1
  { id: "1", name: "LeBron James", team: "LAL", position: "SF", number: "23", imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/2544.png", stats: { ppg: 25.7, rpg: 7.3, apg: 8.3 } },
  { id: "2", name: "Stephen Curry", team: "GSW", position: "PG", number: "30", imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/201939.png", stats: { ppg: 26.4, rpg: 4.5, apg: 6.1 } },
  { id: "3", name: "Kevin Durant", team: "PHX", position: "SF", number: "35", imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/201142.png", stats: { ppg: 29.1, rpg: 6.6, apg: 5.0 } },
  { id: "4", name: "Giannis Antetokounmpo", team: "MIL", position: "PF", number: "34", imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/203507.png", stats: { ppg: 30.4, rpg: 11.5, apg: 5.7 } },
  { id: "5", name: "Luka Doncic", team: "DAL", position: "PG", number: "77", imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1629029.png", stats: { ppg: 32.4, rpg: 8.6, apg: 8.0 } },
  { id: "6", name: "Nikola Jokic", team: "DEN", position: "C", number: "15", imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/203999.png", stats: { ppg: 26.4, rpg: 12.4, apg: 9.0 } },
  // Row 2
  { id: "7", name: "Joel Embiid", team: "PHI", position: "C", number: "21", imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/203954.png", stats: { ppg: 28.6, rpg: 11.3, apg: 4.2 } },
  { id: "8", name: "Jayson Tatum", team: "BOS", position: "SF", number: "0", imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1628369.png", stats: { ppg: 26.9, rpg: 8.1, apg: 4.9 } },
  { id: "9", name: "Anthony Edwards", team: "MIN", position: "SG", number: "5", imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1630162.png", stats: { ppg: 25.9, rpg: 5.4, apg: 5.1 } },
  { id: "10", name: "Shai Gilgeous-Alexander", team: "OKC", position: "PG", number: "2", imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1628983.png", stats: { ppg: 30.1, rpg: 5.5, apg: 6.2 } },
  { id: "11", name: "Ja Morant", team: "MEM", position: "PG", number: "12", imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1629630.png", stats: { ppg: 25.1, rpg: 5.6, apg: 8.1 } },
  { id: "12", name: "Devin Booker", team: "PHX", position: "SG", number: "1", imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1626164.png", stats: { ppg: 27.1, rpg: 4.5, apg: 6.9 } },
  // Row 3
  { id: "13", name: "Jaylen Brown", team: "BOS", position: "SG", number: "7", imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1627759.png", stats: { ppg: 23.0, rpg: 5.5, apg: 3.6 } },
  { id: "14", name: "Donovan Mitchell", team: "CLE", position: "SG", number: "45", imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1628378.png", stats: { ppg: 26.6, rpg: 5.1, apg: 4.5 } },
  { id: "15", name: "Damian Lillard", team: "MIL", position: "PG", number: "0", imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/203081.png", stats: { ppg: 24.3, rpg: 4.4, apg: 7.0 } },
  { id: "16", name: "Kyrie Irving", team: "DAL", position: "PG", number: "11", imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/202681.png", stats: { ppg: 25.6, rpg: 5.0, apg: 5.2 } },
  { id: "17", name: "Tyrese Haliburton", team: "IND", position: "PG", number: "0", imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1630169.png", stats: { ppg: 20.1, rpg: 3.9, apg: 10.9 } },
  { id: "18", name: "Trae Young", team: "ATL", position: "PG", number: "11", imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1629027.png", stats: { ppg: 25.7, rpg: 2.8, apg: 10.8 } },
  // Row 4
  { id: "19", name: "Jimmy Butler", team: "MIA", position: "SF", number: "22", imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/202710.png", stats: { ppg: 20.8, rpg: 5.3, apg: 5.0 } },
  { id: "20", name: "Paul George", team: "PHI", position: "SF", number: "8", imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/202331.png", stats: { ppg: 22.6, rpg: 5.2, apg: 3.5 } },
  { id: "21", name: "Kawhi Leonard", team: "LAC", position: "SF", number: "2", imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/202695.png", stats: { ppg: 23.7, rpg: 6.1, apg: 3.6 } },
  { id: "22", name: "Bam Adebayo", team: "MIA", position: "C", number: "13", imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1628389.png", stats: { ppg: 19.3, rpg: 10.4, apg: 3.9 } },
  { id: "23", name: "Karl-Anthony Towns", team: "NYK", position: "C", number: "32", imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1626157.png", stats: { ppg: 21.8, rpg: 8.3, apg: 3.0 } },
  { id: "24", name: "Domantas Sabonis", team: "SAC", position: "C", number: "10", imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1627734.png", stats: { ppg: 19.4, rpg: 13.7, apg: 8.2 } },
  // Row 5
  { id: "25", name: "De'Aaron Fox", team: "SAC", position: "PG", number: "5", imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1628368.png", stats: { ppg: 26.6, rpg: 4.6, apg: 5.6 } },
  { id: "26", name: "Jalen Brunson", team: "NYK", position: "PG", number: "11", imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1628973.png", stats: { ppg: 28.7, rpg: 3.6, apg: 6.7 } },
  { id: "27", name: "Zion Williamson", team: "NOP", position: "PF", number: "1", imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1629627.png", stats: { ppg: 22.9, rpg: 5.8, apg: 5.0 } },
  { id: "28", name: "Pascal Siakam", team: "IND", position: "PF", number: "43", imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1627783.png", stats: { ppg: 21.3, rpg: 7.8, apg: 3.8 } },
  { id: "29", name: "Chet Holmgren", team: "OKC", position: "C", number: "7", imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1631096.png", stats: { ppg: 16.5, rpg: 7.9, apg: 2.4 } },
  { id: "30", name: "Victor Wembanyama", team: "SAS", position: "C", number: "1", imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1641705.png", stats: { ppg: 21.4, rpg: 10.6, apg: 3.9 } },
  // Row 6
  { id: "31", name: "Lauri Markkanen", team: "UTA", position: "PF", number: "23", imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1628374.png", stats: { ppg: 23.2, rpg: 8.2, apg: 2.0 } },
  { id: "32", name: "DeMar DeRozan", team: "SAC", position: "SF", number: "10", imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/201942.png", stats: { ppg: 24.0, rpg: 4.3, apg: 5.3 } },
  { id: "33", name: "Julius Randle", team: "MIN", position: "PF", number: "30", imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/203944.png", stats: { ppg: 24.0, rpg: 9.2, apg: 5.0 } },
  { id: "34", name: "Brandon Ingram", team: "NOP", position: "SF", number: "14", imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1627742.png", stats: { ppg: 24.7, rpg: 5.1, apg: 5.7 } },
  { id: "35", name: "Scottie Barnes", team: "TOR", position: "SF", number: "4", imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1630567.png", stats: { ppg: 19.9, rpg: 8.2, apg: 6.1 } },
  { id: "36", name: "Franz Wagner", team: "ORL", position: "SF", number: "22", imageUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/1630532.png", stats: { ppg: 19.7, rpg: 5.3, apg: 3.7 } },
];

export default function PlayersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [positionFilter, setPositionFilter] = useState("ALL");

  const positions = ["ALL", "PG", "SG", "SF", "PF", "C"];

  const filteredPlayers = mockPlayers.filter((player) => {
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          player.team.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPosition = positionFilter === "ALL" || player.position === positionFilter;
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {filteredPlayers.map((player) => (
                <Card key={player.id} variant="default" hover className="p-4 md:p-5 text-center">
                  <div
                    className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-3 bg-cover bg-top rounded-full border-2 border-[var(--orange)]"
                    style={{ backgroundImage: `url('${player.imageUrl}')` }}
                  />
                  <h3 className="font-semibold text-white text-sm mb-1 truncate">{player.name}</h3>
                  <p className="text-white/50 text-xs mb-2">
                    {player.team} • #{player.number} • {player.position}
                  </p>
                  <div className="flex justify-center gap-3 text-xs">
                    <div>
                      <p className="text-[var(--orange)] font-bold">{player.stats.ppg}</p>
                      <p className="text-white/40">PPG</p>
                    </div>
                    <div>
                      <p className="text-white font-bold">{player.stats.rpg}</p>
                      <p className="text-white/40">RPG</p>
                    </div>
                    <div>
                      <p className="text-white font-bold">{player.stats.apg}</p>
                      <p className="text-white/40">APG</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
