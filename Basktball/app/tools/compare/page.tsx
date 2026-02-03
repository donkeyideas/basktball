"use client";

import { useState, useEffect, useCallback } from "react";
import { Header, Footer } from "@/components";

interface Player {
  id: string;
  name: string;
  team?: { name: string; abbreviation: string };
  position?: string;
}

interface PlayerStats {
  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
  fgPct: number;
  threePct: number;
  ftPct: number;
  mpg: number;
  tov: number;
}

// Sample stats for demonstration
const sampleStats: Record<string, PlayerStats> = {
  default: { ppg: 25.4, rpg: 7.2, apg: 6.8, spg: 1.2, bpg: 0.8, fgPct: 48.5, threePct: 38.2, ftPct: 85.6, mpg: 34.2, tov: 3.1 },
};

function StatBar({ label, value1, value2, max }: { label: string; value1: number; value2: number; max: number }) {
  const pct1 = (value1 / max) * 100;
  const pct2 = (value2 / max) * 100;
  const winner = value1 > value2 ? 1 : value2 > value1 ? 2 : 0;

  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
        <span style={{
          fontFamily: "var(--font-roboto-mono), monospace",
          fontSize: "18px",
          fontWeight: "bold",
          color: winner === 1 ? "var(--green)" : "inherit"
        }}>
          {value1.toFixed(1)}
        </span>
        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>{label}</span>
        <span style={{
          fontFamily: "var(--font-roboto-mono), monospace",
          fontSize: "18px",
          fontWeight: "bold",
          color: winner === 2 ? "var(--green)" : "inherit"
        }}>
          {value2.toFixed(1)}
        </span>
      </div>
      <div style={{ display: "flex", gap: "4px", height: "8px" }}>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden", display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: `${pct1}%`, background: winner === 1 ? "var(--green)" : "var(--orange)", borderRadius: "4px", transition: "width 0.5s ease" }} />
        </div>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden" }}>
          <div style={{ width: `${pct2}%`, background: winner === 2 ? "var(--green)" : "var(--blue)", borderRadius: "4px", transition: "width 0.5s ease" }} />
        </div>
      </div>
    </div>
  );
}

export default function ComparePage() {
  const [search1, setSearch1] = useState("");
  const [search2, setSearch2] = useState("");
  const [players1, setPlayers1] = useState<Player[]>([]);
  const [players2, setPlayers2] = useState<Player[]>([]);
  const [selected1, setSelected1] = useState<Player | null>(null);
  const [selected2, setSelected2] = useState<Player | null>(null);
  const [stats1, setStats1] = useState<PlayerStats>(sampleStats.default);
  const [stats2, setStats2] = useState<PlayerStats>({ ...sampleStats.default, ppg: 22.1, rpg: 5.8, apg: 8.2, spg: 1.5, bpg: 0.3, fgPct: 45.2, threePct: 41.5, ftPct: 88.2, mpg: 35.8, tov: 2.8 });
  const [isSearching1, setIsSearching1] = useState(false);
  const [isSearching2, setIsSearching2] = useState(false);

  const searchPlayers = useCallback(async (query: string, setPlayers: (p: Player[]) => void, setSearching: (b: boolean) => void) => {
    if (query.length < 2) {
      setPlayers([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/players?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        setPlayers(data.players || []);
      }
    } catch {
      setPlayers([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchPlayers(search1, setPlayers1, setIsSearching1), 300);
    return () => clearTimeout(timer);
  }, [search1, searchPlayers]);

  useEffect(() => {
    const timer = setTimeout(() => searchPlayers(search2, setPlayers2, setIsSearching2), 300);
    return () => clearTimeout(timer);
  }, [search2, searchPlayers]);

  const selectPlayer = (player: Player, side: 1 | 2) => {
    if (side === 1) {
      setSelected1(player);
      setSearch1("");
      setPlayers1([]);
      // Generate random-ish stats based on player name for demo
      const seed = player.name.length;
      setStats1({
        ppg: 20 + (seed % 15),
        rpg: 4 + (seed % 8),
        apg: 3 + (seed % 9),
        spg: 0.8 + (seed % 15) / 10,
        bpg: 0.3 + (seed % 12) / 10,
        fgPct: 42 + (seed % 12),
        threePct: 32 + (seed % 15),
        ftPct: 75 + (seed % 20),
        mpg: 28 + (seed % 10),
        tov: 1.5 + (seed % 20) / 10,
      });
    } else {
      setSelected2(player);
      setSearch2("");
      setPlayers2([]);
      const seed = player.name.length + 5;
      setStats2({
        ppg: 20 + (seed % 15),
        rpg: 4 + (seed % 8),
        apg: 3 + (seed % 9),
        spg: 0.8 + (seed % 15) / 10,
        bpg: 0.3 + (seed % 12) / 10,
        fgPct: 42 + (seed % 12),
        threePct: 32 + (seed % 15),
        ftPct: 75 + (seed % 20),
        mpg: 28 + (seed % 10),
        tov: 1.5 + (seed % 20) / 10,
      });
    }
  };

  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h1 style={{
            fontFamily: "var(--font-anton), Anton, sans-serif",
            fontSize: "48px",
            marginBottom: "20px",
            textAlign: "center"
          }}>
            PLAYER COMPARISON
            <span style={{
              display: "block",
              width: "100px",
              height: "4px",
              background: "var(--orange)",
              margin: "15px auto 0"
            }}></span>
          </h1>

          {/* Player Selection */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 1fr", gap: "20px", marginTop: "40px", marginBottom: "40px" }}>
            {/* Player 1 */}
            <div className="section">
              <div className="section-title" style={{ color: "var(--orange)" }}>Player 1</div>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={search1}
                  onChange={(e) => setSearch1(e.target.value)}
                  placeholder="Search player..."
                  style={{
                    width: "100%",
                    padding: "12px 15px",
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "var(--white)",
                    fontSize: "16px"
                  }}
                />
                {isSearching1 && <span style={{ position: "absolute", right: "15px", top: "12px", color: "rgba(255,255,255,0.5)" }}>...</span>}
                {players1.length > 0 && (
                  <div style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: "var(--dark-gray)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    maxHeight: "200px",
                    overflowY: "auto",
                    zIndex: 10
                  }}>
                    {players1.map(player => (
                      <div
                        key={player.id}
                        onClick={() => selectPlayer(player, 1)}
                        style={{
                          padding: "12px 15px",
                          cursor: "pointer",
                          borderBottom: "1px solid rgba(255,255,255,0.05)"
                        }}
                      >
                        {player.name} {player.team && `(${player.team.abbreviation})`}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selected1 && (
                <div style={{ marginTop: "20px", textAlign: "center" }}>
                  <div style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    background: "var(--orange)",
                    margin: "0 auto 15px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "28px",
                    fontWeight: "bold"
                  }}>
                    {selected1.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <h3 style={{ fontFamily: "var(--font-anton), Anton, sans-serif", fontSize: "24px" }}>{selected1.name}</h3>
                  <p style={{ color: "rgba(255,255,255,0.5)" }}>{selected1.team?.name || "Free Agent"}</p>
                </div>
              )}
            </div>

            {/* VS */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{
                fontFamily: "var(--font-anton), Anton, sans-serif",
                fontSize: "36px",
                color: "rgba(255,255,255,0.3)"
              }}>VS</span>
            </div>

            {/* Player 2 */}
            <div className="section">
              <div className="section-title" style={{ color: "var(--blue)" }}>Player 2</div>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={search2}
                  onChange={(e) => setSearch2(e.target.value)}
                  placeholder="Search player..."
                  style={{
                    width: "100%",
                    padding: "12px 15px",
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "var(--white)",
                    fontSize: "16px"
                  }}
                />
                {isSearching2 && <span style={{ position: "absolute", right: "15px", top: "12px", color: "rgba(255,255,255,0.5)" }}>...</span>}
                {players2.length > 0 && (
                  <div style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: "var(--dark-gray)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    maxHeight: "200px",
                    overflowY: "auto",
                    zIndex: 10
                  }}>
                    {players2.map(player => (
                      <div
                        key={player.id}
                        onClick={() => selectPlayer(player, 2)}
                        style={{
                          padding: "12px 15px",
                          cursor: "pointer",
                          borderBottom: "1px solid rgba(255,255,255,0.05)"
                        }}
                      >
                        {player.name} {player.team && `(${player.team.abbreviation})`}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selected2 && (
                <div style={{ marginTop: "20px", textAlign: "center" }}>
                  <div style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    background: "var(--blue)",
                    margin: "0 auto 15px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "28px",
                    fontWeight: "bold"
                  }}>
                    {selected2.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <h3 style={{ fontFamily: "var(--font-anton), Anton, sans-serif", fontSize: "24px" }}>{selected2.name}</h3>
                  <p style={{ color: "rgba(255,255,255,0.5)" }}>{selected2.team?.name || "Free Agent"}</p>
                </div>
              )}
            </div>
          </div>

          {/* Stats Comparison */}
          <div className="section">
            <div className="section-title">Statistical Comparison</div>
            <StatBar label="PPG" value1={stats1.ppg} value2={stats2.ppg} max={40} />
            <StatBar label="RPG" value1={stats1.rpg} value2={stats2.rpg} max={15} />
            <StatBar label="APG" value1={stats1.apg} value2={stats2.apg} max={12} />
            <StatBar label="SPG" value1={stats1.spg} value2={stats2.spg} max={3} />
            <StatBar label="BPG" value1={stats1.bpg} value2={stats2.bpg} max={3} />
            <StatBar label="FG%" value1={stats1.fgPct} value2={stats2.fgPct} max={60} />
            <StatBar label="3P%" value1={stats1.threePct} value2={stats2.threePct} max={50} />
            <StatBar label="FT%" value1={stats1.ftPct} value2={stats2.ftPct} max={100} />
            <StatBar label="MPG" value1={stats1.mpg} value2={stats2.mpg} max={42} />
            <StatBar label="TOV" value1={stats1.tov} value2={stats2.tov} max={5} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
