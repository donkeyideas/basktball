"use client";

import { useState, useEffect } from "react";
import { Header, Footer } from "@/components";

interface TeamStats {
  id: string;
  name: string;
  abbreviation: string;
  logoUrl: string;
  wins: number;
  losses: number;
  ppg: number;
  oppPpg: number;
  differential: number;
  streak: number;
  seed: number;
  winPct: number;
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
  const [sortBy, setSortBy] = useState<keyof TeamStats>("winPct");
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

  const formatStreak = (s: number) => {
    if (s > 0) return `W${s}`;
    if (s < 0) return `L${Math.abs(s)}`;
    return "-";
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
            Comprehensive team performance analysis with live standings data.
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
          <div className="team-analytics-layout">
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
                {selectedTeam && (
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <img
                    src={selectedTeam.logoUrl || `https://a.espncdn.com/i/teamlogos/nba/500/${selectedTeam.abbreviation.toLowerCase()}.png`}
                    alt={selectedTeam.name}
                    style={{
                      width: "100px",
                      height: "100px",
                      objectFit: "contain",
                      margin: "0 auto 15px",
                      display: "block"
                    }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <h3 style={{ fontFamily: "var(--font-anton), Anton, sans-serif", fontSize: "24px" }}>
                    {selectedTeam.name}
                  </h3>
                  <p style={{
                    fontFamily: "var(--font-roboto-mono), monospace",
                    fontSize: "20px",
                    marginTop: "5px"
                  }}>
                    {selectedTeam.wins}-{selectedTeam.losses}
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginTop: "5px" }}>
                    {selectedTeam.seed > 0 ? `#${selectedTeam.seed} Seed` : ""}
                    {selectedTeam.streak !== 0 ? ` | ${formatStreak(selectedTeam.streak)}` : ""}
                  </p>
                </div>
                )}

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
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "5px" }}>DIFF</div>
                    <StatRank value={`${selectedTeam.differential > 0 ? "+" : ""}${selectedTeam.differential.toFixed(1)}`} rank={getRank(selectedTeam, "differential")} total={teams.length} />
                  </div>
                  <div style={{ background: "rgba(0,0,0,0.3)", padding: "15px", textAlign: "center" }}>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "5px" }}>WIN %</div>
                    <StatRank value={`${(selectedTeam.winPct * 100).toFixed(1)}%`} rank={getRank(selectedTeam, "winPct")} total={teams.length} />
                  </div>
                </div>
                )}
              </div>
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
                        onClick={() => handleSort("ppg")}
                        style={{ padding: "12px", textAlign: "center", cursor: "pointer" }}
                      >
                        PPG {sortBy === "ppg" && (sortDir === "desc" ? "▼" : "▲")}
                      </th>
                      <th
                        onClick={() => handleSort("oppPpg")}
                        style={{ padding: "12px", textAlign: "center", cursor: "pointer" }}
                      >
                        OPP PPG {sortBy === "oppPpg" && (sortDir === "desc" ? "▼" : "▲")}
                      </th>
                      <th
                        onClick={() => handleSort("differential")}
                        style={{ padding: "12px", textAlign: "center", cursor: "pointer" }}
                      >
                        DIFF {sortBy === "differential" && (sortDir === "desc" ? "▼" : "▲")}
                      </th>
                      <th
                        onClick={() => handleSort("streak")}
                        style={{ padding: "12px", textAlign: "center", cursor: "pointer" }}
                      >
                        STRK {sortBy === "streak" && (sortDir === "desc" ? "▼" : "▲")}
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
                            <img
                              src={team.logoUrl || `https://a.espncdn.com/i/teamlogos/nba/500/${team.abbreviation.toLowerCase()}.png`}
                              alt={team.abbreviation}
                              style={{ width: "24px", height: "24px", objectFit: "contain" }}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                            <span style={{ fontWeight: "bold" }}>{team.abbreviation}</span>
                            <span style={{ color: "rgba(255,255,255,0.5)" }}>{team.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: "12px", textAlign: "center", fontFamily: "var(--font-roboto-mono), monospace" }}>
                          {team.wins}-{team.losses}
                        </td>
                        <td style={{ padding: "12px", textAlign: "center", fontFamily: "var(--font-roboto-mono), monospace" }}>
                          {team.ppg.toFixed(1)}
                        </td>
                        <td style={{ padding: "12px", textAlign: "center", fontFamily: "var(--font-roboto-mono), monospace" }}>
                          {team.oppPpg.toFixed(1)}
                        </td>
                        <td style={{
                          padding: "12px",
                          textAlign: "center",
                          fontFamily: "var(--font-roboto-mono), monospace",
                          color: team.differential > 0 ? "var(--green)" : team.differential < 0 ? "var(--red)" : "inherit"
                        }}>
                          {team.differential > 0 ? "+" : ""}{team.differential.toFixed(1)}
                        </td>
                        <td style={{
                          padding: "12px",
                          textAlign: "center",
                          fontFamily: "var(--font-roboto-mono), monospace",
                          color: team.streak > 0 ? "var(--green)" : team.streak < 0 ? "var(--red)" : "inherit"
                        }}>
                          {formatStreak(team.streak)}
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
