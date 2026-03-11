"use client";

import { useState, useEffect, useCallback } from "react";
import { Header, Footer } from "@/components";

interface Player {
  id: string;
  nbaId?: string; // Official NBA player ID for headshots/stats
  name: string;
  team?: { name: string; abbreviation: string };
  position?: string;
  headshotUrl?: string;
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

const emptyStats: PlayerStats = {
  ppg: 0, rpg: 0, apg: 0, spg: 0, bpg: 0,
  fgPct: 0, threePct: 0, ftPct: 0, mpg: 0, tov: 0
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
        <div style={{ flex: 1, background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden", position: "relative" }}>
          <div style={{
            width: `${pct1}%`,
            height: "100%",
            background: winner === 1 ? "var(--green)" : "var(--orange)",
            borderRadius: "4px",
            transition: "width 0.5s ease",
            position: "absolute",
            right: 0
          }} />
        </div>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden" }}>
          <div style={{ width: `${pct2}%`, height: "100%", background: winner === 2 ? "var(--green)" : "var(--blue)", borderRadius: "4px", transition: "width 0.5s ease" }} />
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
  const [stats1, setStats1] = useState<PlayerStats | null>(null);
  const [stats2, setStats2] = useState<PlayerStats | null>(null);
  const [isSearching1, setIsSearching1] = useState(false);
  const [isSearching2, setIsSearching2] = useState(false);
  const [loadingStats1, setLoadingStats1] = useState(false);
  const [loadingStats2, setLoadingStats2] = useState(false);

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

  const fetchPlayerStats = async (player: Player, setStats: (s: PlayerStats | null) => void, setLoading: (b: boolean) => void) => {
    setLoading(true);
    try {
      // Use nbaId if available, otherwise fall back to regular id
      const playerId = player.nbaId || player.id;
      // Pass player name as fallback for lookup
      const res = await fetch(`/api/players/${playerId}/stats?name=${encodeURIComponent(player.name)}`);
      const data = await res.json();
      if (data.success && data.stats) {
        setStats(data.stats);
      } else {
        setStats(emptyStats);
      }
    } catch {
      setStats(emptyStats);
    } finally {
      setLoading(false);
    }
  };

  const selectPlayer = (player: Player, side: 1 | 2) => {
    if (side === 1) {
      setSelected1(player);
      setSearch1("");
      setPlayers1([]);
      fetchPlayerStats(player, setStats1, setLoadingStats1);
    } else {
      setSelected2(player);
      setSearch2("");
      setPlayers2([]);
      fetchPlayerStats(player, setStats2, setLoadingStats2);
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
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    background: "var(--dark-gray)",
                    margin: "0 auto 15px",
                    overflow: "hidden",
                    border: "3px solid var(--orange)"
                  }}>
                    <img
                      src={selected1.headshotUrl || `https://cdn.nba.com/headshots/nba/latest/1040x760/${selected1.nbaId || selected1.id}.png`}
                      alt={selected1.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        target.parentElement!.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:bold;background:var(--orange)">${selected1.name.split(" ").map(n => n[0]).join("")}</div>`;
                      }}
                    />
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
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    background: "var(--dark-gray)",
                    margin: "0 auto 15px",
                    overflow: "hidden",
                    border: "3px solid var(--blue)"
                  }}>
                    <img
                      src={selected2.headshotUrl || `https://cdn.nba.com/headshots/nba/latest/1040x760/${selected2.nbaId || selected2.id}.png`}
                      alt={selected2.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        target.parentElement!.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:bold;background:var(--blue)">${selected2.name.split(" ").map(n => n[0]).join("")}</div>`;
                      }}
                    />
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
            {!selected1 && !selected2 ? (
              <p style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", padding: "40px 0" }}>
                Select two players to compare their statistics
              </p>
            ) : loadingStats1 || loadingStats2 ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{
                  width: "30px",
                  height: "30px",
                  border: "3px solid rgba(255,255,255,0.1)",
                  borderTopColor: "var(--orange)",
                  borderRadius: "50%",
                  margin: "0 auto 15px",
                  animation: "spin 1s linear infinite"
                }} />
                <p style={{ color: "rgba(255,255,255,0.6)" }}>Loading stats...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : (
              <>
                <StatBar label="PPG" value1={stats1?.ppg || 0} value2={stats2?.ppg || 0} max={40} />
                <StatBar label="RPG" value1={stats1?.rpg || 0} value2={stats2?.rpg || 0} max={15} />
                <StatBar label="APG" value1={stats1?.apg || 0} value2={stats2?.apg || 0} max={12} />
                <StatBar label="SPG" value1={stats1?.spg || 0} value2={stats2?.spg || 0} max={3} />
                <StatBar label="BPG" value1={stats1?.bpg || 0} value2={stats2?.bpg || 0} max={3} />
                <StatBar label="FG%" value1={stats1?.fgPct || 0} value2={stats2?.fgPct || 0} max={60} />
                <StatBar label="3P%" value1={stats1?.threePct || 0} value2={stats2?.threePct || 0} max={50} />
                <StatBar label="FT%" value1={stats1?.ftPct || 0} value2={stats2?.ftPct || 0} max={100} />
                <StatBar label="MPG" value1={stats1?.mpg || 0} value2={stats2?.mpg || 0} max={42} />
                <StatBar label="TOV" value1={stats1?.tov || 0} value2={stats2?.tov || 0} max={5} />
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
