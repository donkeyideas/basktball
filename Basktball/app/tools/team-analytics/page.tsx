"use client";

import { useState, useEffect } from "react";
import { Header, Footer } from "@/components";

interface TeamStats {
  id: string;
  name: string;
  abbreviation: string;
  wins: number;
  losses: number;
  ppg: number;
  oppPpg: number;
  pace: number;
  offRtg: number;
  defRtg: number;
  netRtg: number;
  efgPct: number;
  tovPct: number;
  orbPct: number;
  ftRate: number;
}

function StatRank({ value, rank, total, inverse = false }: { value: string; rank: number; total: number; inverse?: boolean }) {
  const percentile = inverse ? (total - rank + 1) / total : rank / total;
  const color = percentile <= 0.33 ? "var(--green)" : percentile <= 0.66 ? "var(--yellow)" : "var(--red)";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <span style={{ fontFamily: "var(--font-roboto-mono), monospace", fontWeight: "bold" }}>{value}</span>
      <span style={{
        padding: "2px 6px",
        fontSize: "11px",
        background: color,
        color: "var(--black)",
        fontWeight: "bold"
      }}>
        #{rank}
      </span>
    </div>
  );
}

export default function TeamAnalyticsPage() {
  const [teams, setTeams] = useState<TeamStats[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<TeamStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<keyof TeamStats>("netRtg");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    async function fetchTeams() {
      try {
        const res = await fetch("/api/teams/analytics");
        const data = await res.json();

        if (data.success && data.teams?.length > 0) {
          setTeams(data.teams);
          setSelectedTeam(data.teams[0]);
        }
      } catch (error) {
        console.error("Error fetching team analytics:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTeams();
  }, []);

  const sortedTeams = [...teams].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDir === "desc" ? bVal - aVal : aVal - bVal;
    }
    return 0;
  });

  const getRank = (team: TeamStats, stat: keyof TeamStats, inverse = false) => {
    const sorted = [...teams].sort((a, b) => {
      const aVal = a[stat] as number;
      const bVal = b[stat] as number;
      return inverse ? aVal - bVal : bVal - aVal;
    });
    return sorted.findIndex(t => t.id === team.id) + 1;
  };

  const handleSort = (column: keyof TeamStats) => {
    if (sortBy === column) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortBy(column);
      setSortDir("desc");
    }
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
            TEAM ANALYTICS
            <span style={{
              display: "block",
              width: "100px",
              height: "4px",
              background: "var(--orange)",
              margin: "15px auto 0"
            }}></span>
          </h1>
          <p style={{
            textAlign: "center",
            color: "rgba(255,255,255,0.6)",
            marginBottom: "40px"
          }}>
            Comprehensive team performance analysis including pace, efficiency, and trends.
          </p>

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
              <p style={{ color: "rgba(255,255,255,0.6)" }}>Loading team analytics...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : teams.length === 0 ? (
            <div className="section" style={{ textAlign: "center", padding: "60px 20px" }}>
              <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "10px" }}>No team analytics data available.</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>Check back later for updated team statistics.</p>
            </div>
          ) : (
          <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: "30px" }}>
            {/* Team Selector */}
            <div>
              <div className="section">
                <div className="section-title">Select Team</div>
                <select
                  value={selectedTeam?.id || ""}
                  onChange={(e) => {
                    const team = teams.find(t => t.id === e.target.value);
                    if (team) setSelectedTeam(team);
                  }}
                  style={{
                    width: "100%",
                    padding: "15px",
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "var(--white)",
                    fontSize: "16px",
                    marginBottom: "20px"
                  }}
                >
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>

                {/* Team Card */}
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <div style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    background: "var(--orange)",
                    margin: "0 auto 15px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "32px",
                    fontWeight: "bold"
                  }}>
                    {selectedTeam?.abbreviation}
                  </div>
                  <h3 style={{ fontFamily: "var(--font-anton), Anton, sans-serif", fontSize: "24px" }}>
                    {selectedTeam?.name}
                  </h3>
                  <p style={{
                    fontFamily: "var(--font-roboto-mono), monospace",
                    fontSize: "20px",
                    marginTop: "5px"
                  }}>
                    {selectedTeam?.wins}-{selectedTeam?.losses}
                  </p>
                </div>

                {/* Quick Stats */}
                {selectedTeam && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div style={{ background: "rgba(0,0,0,0.3)", padding: "15px", textAlign: "center" }}>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "5px" }}>PPG</div>
                    <StatRank value={selectedTeam.ppg.toFixed(1)} rank={getRank(selectedTeam, "ppg")} total={teams.length} />
                  </div>
                  <div style={{ background: "rgba(0,0,0,0.3)", padding: "15px", textAlign: "center" }}>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "5px" }}>OPP PPG</div>
                    <StatRank value={selectedTeam.oppPpg.toFixed(1)} rank={getRank(selectedTeam, "oppPpg", true)} total={teams.length} inverse />
                  </div>
                  <div style={{ background: "rgba(0,0,0,0.3)", padding: "15px", textAlign: "center" }}>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "5px" }}>OFF RTG</div>
                    <StatRank value={selectedTeam.offRtg.toFixed(1)} rank={getRank(selectedTeam, "offRtg")} total={teams.length} />
                  </div>
                  <div style={{ background: "rgba(0,0,0,0.3)", padding: "15px", textAlign: "center" }}>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "5px" }}>DEF RTG</div>
                    <StatRank value={selectedTeam.defRtg.toFixed(1)} rank={getRank(selectedTeam, "defRtg", true)} total={teams.length} inverse />
                  </div>
                </div>
                )}
              </div>

              {/* Four Factors */}
              {selectedTeam && (
              <div className="section">
                <div className="section-title">Four Factors</div>
                {[
                  { label: "Effective FG%", key: "efgPct" as const, format: (v: number) => `${v.toFixed(1)}%` },
                  { label: "Turnover %", key: "tovPct" as const, format: (v: number) => `${v.toFixed(1)}%`, inverse: true },
                  { label: "Off. Reb %", key: "orbPct" as const, format: (v: number) => `${v.toFixed(1)}%` },
                  { label: "FT Rate", key: "ftRate" as const, format: (v: number) => v.toFixed(3) },
                ].map(stat => (
                  <div key={stat.key} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px",
                    background: "rgba(0,0,0,0.3)",
                    marginBottom: "8px"
                  }}>
                    <span>{stat.label}</span>
                    <StatRank
                      value={stat.format(selectedTeam[stat.key])}
                      rank={getRank(selectedTeam, stat.key, stat.inverse)}
                      total={teams.length}
                      inverse={stat.inverse}
                    />
                  </div>
                ))}
              </div>
              )}
            </div>

            {/* Team Rankings Table */}
            <div className="section">
              <div className="section-title">League Rankings</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--orange)" }}>
                      <th style={{ padding: "12px", textAlign: "left" }}>Team</th>
                      <th
                        onClick={() => handleSort("wins")}
                        style={{ padding: "12px", textAlign: "center", cursor: "pointer" }}
                      >
                        W-L {sortBy === "wins" && (sortDir === "desc" ? "▼" : "▲")}
                      </th>
                      <th
                        onClick={() => handleSort("netRtg")}
                        style={{ padding: "12px", textAlign: "center", cursor: "pointer" }}
                      >
                        NET RTG {sortBy === "netRtg" && (sortDir === "desc" ? "▼" : "▲")}
                      </th>
                      <th
                        onClick={() => handleSort("offRtg")}
                        style={{ padding: "12px", textAlign: "center", cursor: "pointer" }}
                      >
                        OFF RTG {sortBy === "offRtg" && (sortDir === "desc" ? "▼" : "▲")}
                      </th>
                      <th
                        onClick={() => handleSort("defRtg")}
                        style={{ padding: "12px", textAlign: "center", cursor: "pointer" }}
                      >
                        DEF RTG {sortBy === "defRtg" && (sortDir === "desc" ? "▼" : "▲")}
                      </th>
                      <th
                        onClick={() => handleSort("pace")}
                        style={{ padding: "12px", textAlign: "center", cursor: "pointer" }}
                      >
                        PACE {sortBy === "pace" && (sortDir === "desc" ? "▼" : "▲")}
                      </th>
                      <th
                        onClick={() => handleSort("efgPct")}
                        style={{ padding: "12px", textAlign: "center", cursor: "pointer" }}
                      >
                        eFG% {sortBy === "efgPct" && (sortDir === "desc" ? "▼" : "▲")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTeams.map((team, index) => (
                      <tr
                        key={team.id}
                        onClick={() => setSelectedTeam(team)}
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.1)",
                          background: selectedTeam?.id === team.id ? "rgba(255, 107, 53, 0.15)" : "transparent",
                          cursor: "pointer"
                        }}
                      >
                        <td style={{ padding: "12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{
                              width: "24px",
                              textAlign: "center",
                              fontFamily: "var(--font-roboto-mono), monospace",
                              color: "rgba(255,255,255,0.5)"
                            }}>
                              {index + 1}
                            </span>
                            <span style={{ fontWeight: "bold" }}>{team.abbreviation}</span>
                            <span style={{ color: "rgba(255,255,255,0.5)" }}>{team.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: "12px", textAlign: "center", fontFamily: "var(--font-roboto-mono), monospace" }}>
                          {team.wins}-{team.losses}
                        </td>
                        <td style={{
                          padding: "12px",
                          textAlign: "center",
                          fontFamily: "var(--font-roboto-mono), monospace",
                          color: team.netRtg > 0 ? "var(--green)" : "var(--red)"
                        }}>
                          {team.netRtg > 0 ? "+" : ""}{team.netRtg.toFixed(1)}
                        </td>
                        <td style={{ padding: "12px", textAlign: "center", fontFamily: "var(--font-roboto-mono), monospace" }}>
                          {team.offRtg.toFixed(1)}
                        </td>
                        <td style={{ padding: "12px", textAlign: "center", fontFamily: "var(--font-roboto-mono), monospace" }}>
                          {team.defRtg.toFixed(1)}
                        </td>
                        <td style={{ padding: "12px", textAlign: "center", fontFamily: "var(--font-roboto-mono), monospace" }}>
                          {team.pace.toFixed(1)}
                        </td>
                        <td style={{ padding: "12px", textAlign: "center", fontFamily: "var(--font-roboto-mono), monospace" }}>
                          {team.efgPct.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
