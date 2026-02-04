"use client";

import { useState, useEffect, useCallback } from "react";
import { Header, Footer } from "@/components";

interface Shot {
  x: number;
  y: number;
  made: boolean;
  type: string;
}

interface Player {
  id: string;
  name: string;
  team?: { name: string; abbreviation: string };
}

interface ZoneStats {
  made: number;
  total: number;
  pct: number;
}

// Map API zone names to display names
const zoneMap: Record<string, string> = {
  "rim": "Rim",
  "paint": "Paint",
  "mid": "Mid",
  "3pt": "3PT",
};

export default function ShotChartPage() {
  const [shots, setShots] = useState<Shot[]>([]);
  const [filter, setFilter] = useState<"all" | "made" | "missed">("all");
  const [zoneFilter, setZoneFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [zones, setZones] = useState<Record<string, ZoneStats>>({});

  const searchPlayers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setPlayers([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/players?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        setPlayers(data.players || []);
      }
    } catch {
      setPlayers([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchPlayers(search), 300);
    return () => clearTimeout(timer);
  }, [search, searchPlayers]);

  const selectPlayer = async (player: Player) => {
    setSelectedPlayer(player);
    setSearch("");
    setPlayers([]);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/shots/${player.id}`);
      const data = await res.json();

      if (data.success && data.shots) {
        // Convert API shot format to UI format (percentage to pixel coordinates)
        const mappedShots: Shot[] = data.shots.map((s: any) => ({
          x: Math.round(s.x * 5), // 0-100 to 0-500
          y: Math.round((100 - s.y) * 4.7), // Flip Y and scale to 0-470
          made: s.made,
          type: zoneMap[s.zone] || s.zone,
        }));
        setShots(mappedShots);

        // Set zone stats
        if (data.zones) {
          setZones(data.zones);
        }
      }
    } catch (error) {
      console.error("Error fetching shot data:", error);
      setShots([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredShots = shots.filter(shot => {
    if (filter === "made" && !shot.made) return false;
    if (filter === "missed" && shot.made) return false;
    if (zoneFilter !== "all" && shot.type !== zoneFilter) return false;
    return true;
  });

  const stats = {
    total: shots.length,
    made: shots.filter(s => s.made).length,
    missed: shots.filter(s => !s.made).length,
    percentage: shots.length > 0 ? ((shots.filter(s => s.made).length / shots.length) * 100).toFixed(1) : "0.0",
    threePoint: zones["3pt"] || { made: 0, total: 0, pct: 0 },
    midRange: zones["mid"] || { made: 0, total: 0, pct: 0 },
    paint: zones["paint"] || { made: 0, total: 0, pct: 0 },
    rim: zones["rim"] || { made: 0, total: 0, pct: 0 },
  };

  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <h1 style={{
            fontFamily: "var(--font-anton), Anton, sans-serif",
            fontSize: "48px",
            marginBottom: "20px",
            textAlign: "center"
          }}>
            SHOT CHART ANALYZER
            <span style={{
              display: "block",
              width: "100px",
              height: "4px",
              background: "var(--orange)",
              margin: "15px auto 0"
            }}></span>
          </h1>

          {/* Player Search */}
          <div className="section" style={{ marginBottom: "30px" }}>
            <div className="section-title">Select Player</div>
            <div style={{ position: "relative", maxWidth: "400px", margin: "0 auto" }}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for a player..."
                style={{
                  width: "100%",
                  padding: "15px",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "var(--white)",
                  fontSize: "16px"
                }}
              />
              {isSearching && <span style={{ position: "absolute", right: "15px", top: "15px", color: "rgba(255,255,255,0.5)" }}>...</span>}
              {players.length > 0 && (
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
                  {players.map(player => (
                    <div
                      key={player.id}
                      onClick={() => selectPlayer(player)}
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
            {selectedPlayer && (
              <div style={{ textAlign: "center", marginTop: "15px" }}>
                <span style={{ fontFamily: "var(--font-anton), Anton, sans-serif", fontSize: "20px" }}>
                  {selectedPlayer.name}
                </span>
                {selectedPlayer.team && (
                  <span style={{ color: "rgba(255,255,255,0.5)", marginLeft: "10px" }}>
                    ({selectedPlayer.team.abbreviation})
                  </span>
                )}
              </div>
            )}
          </div>

          {isLoading ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{
                width: "40px",
                height: "40px",
                border: "3px solid rgba(255,255,255,0.1)",
                borderTopColor: "var(--orange)",
                borderRadius: "50%",
                margin: "0 auto 20px",
                animation: "spin 1s linear infinite"
              }} />
              <p style={{ color: "rgba(255,255,255,0.6)" }}>Loading shot chart...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : !selectedPlayer ? (
            <div className="section" style={{ textAlign: "center", padding: "60px 20px" }}>
              <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "10px" }}>Search for a player to view their shot chart</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>Shot data is generated from player game statistics</p>
            </div>
          ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "40px", marginTop: "40px" }}>
            {/* Court */}
            <div className="section">
              <div className="section-title">Shot Distribution</div>
              <div style={{ position: "relative", width: "500px", height: "470px", margin: "0 auto", background: "rgba(200, 159, 108, 0.1)", border: "3px solid var(--court-wood)" }}>
                {/* Court markings - basket at top */}
                <svg width="500" height="470" style={{ position: "absolute", top: 0, left: 0 }}>
                  {/* Backboard */}
                  <rect x="220" y="35" width="60" height="5" fill="var(--court-wood)" />
                  {/* Basket/Rim */}
                  <circle cx="250" cy="55" r="15" fill="none" stroke="var(--orange)" strokeWidth="3" />
                  {/* Restricted area arc */}
                  <path d="M 210 55 A 40 40 0 0 0 290 55" fill="none" stroke="var(--court-wood)" strokeWidth="2" />
                  {/* Paint/Key rectangle */}
                  <rect x="170" y="0" width="160" height="190" fill="none" stroke="var(--court-wood)" strokeWidth="2" />
                  {/* Free throw circle */}
                  <circle cx="250" cy="190" r="60" fill="none" stroke="var(--court-wood)" strokeWidth="2" />
                  {/* Three point line - corners straight, arc in middle */}
                  <path
                    d="M 30 0 L 30 140 A 220 220 0 0 0 470 140 L 470 0"
                    fill="none"
                    stroke="var(--court-wood)"
                    strokeWidth="2"
                  />
                </svg>

                {/* Shots */}
                {filteredShots.map((shot, index) => (
                  <div
                    key={index}
                    style={{
                      position: "absolute",
                      left: shot.x - 8,
                      top: shot.y - 8,
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      background: shot.made ? "var(--green)" : "var(--red)",
                      border: "2px solid var(--white)",
                      opacity: 0.8,
                      transition: "all 0.3s ease"
                    }}
                    title={`${shot.type} - ${shot.made ? "Made" : "Missed"}`}
                  />
                ))}
              </div>

              {/* Filters */}
              <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "20px" }}>
                {["all", "made", "missed"].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f as typeof filter)}
                    style={{
                      padding: "8px 20px",
                      background: filter === f ? "var(--orange)" : "transparent",
                      border: "1px solid",
                      borderColor: filter === f ? "var(--orange)" : "rgba(255,255,255,0.2)",
                      color: "var(--white)",
                      cursor: "pointer",
                      textTransform: "capitalize"
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div>
              <div className="section">
                <div className="section-title">Shot Statistics</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                  <div style={{ background: "rgba(0,0,0,0.3)", padding: "20px", textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--font-roboto-mono), monospace", fontSize: "32px", fontWeight: "bold" }}>
                      {stats.percentage}%
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>FG%</div>
                  </div>
                  <div style={{ background: "rgba(0,0,0,0.3)", padding: "20px", textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--font-roboto-mono), monospace", fontSize: "32px", fontWeight: "bold" }}>
                      {stats.made}/{stats.total}
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>FGM/FGA</div>
                  </div>
                </div>
              </div>

              <div className="section">
                <div className="section-title">By Zone</div>
                {[
                  { name: "3PT", key: "threePoint" as const, filterKey: "3PT" },
                  { name: "Mid-Range", key: "midRange" as const, filterKey: "Mid" },
                  { name: "Paint", key: "paint" as const, filterKey: "Paint" },
                  { name: "Rim", key: "rim" as const, filterKey: "Rim" },
                ].map(zone => {
                  const zoneStats = stats[zone.key];
                  return (
                    <div
                      key={zone.key}
                      onClick={() => setZoneFilter(zoneFilter === zone.filterKey ? "all" : zone.filterKey)}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "15px",
                        background: zoneFilter === zone.filterKey ? "rgba(255, 107, 53, 0.2)" : "rgba(0,0,0,0.3)",
                        marginBottom: "10px",
                        cursor: "pointer",
                        border: zoneFilter === zone.filterKey ? "1px solid var(--orange)" : "1px solid transparent"
                      }}
                    >
                      <span>{zone.name}</span>
                      <span style={{ fontFamily: "var(--font-roboto-mono), monospace" }}>
                        {zoneStats.made}/{zoneStats.total} ({zoneStats.pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="section">
                <div className="section-title">Legend</div>
                <div style={{ display: "flex", gap: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "var(--green)" }} />
                    <span>Made</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "var(--red)" }} />
                    <span>Missed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
