"use client";

import { useState, useEffect, useCallback } from "react";
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

// Sample team data
const sampleTeams: TeamStats[] = [
  { id: "1", name: "Boston Celtics", abbreviation: "BOS", wins: 42, losses: 12, ppg: 120.5, oppPpg: 109.2, pace: 100.8, offRtg: 119.5, defRtg: 108.2, netRtg: 11.3, efgPct: 58.2, tovPct: 12.1, orbPct: 24.5, ftRate: 0.232 },
  { id: "2", name: "Denver Nuggets", abbreviation: "DEN", wins: 38, losses: 16, ppg: 115.8, oppPpg: 110.5, pace: 98.2, offRtg: 117.8, defRtg: 112.3, netRtg: 5.5, efgPct: 56.8, tovPct: 13.2, orbPct: 26.8, ftRate: 0.215 },
  { id: "3", name: "Milwaukee Bucks", abbreviation: "MIL", wins: 36, losses: 18, ppg: 118.2, oppPpg: 113.8, pace: 101.5, offRtg: 116.4, defRtg: 112.0, netRtg: 4.4, efgPct: 55.5, tovPct: 11.8, orbPct: 25.2, ftRate: 0.248 },
  { id: "4", name: "Oklahoma City Thunder", abbreviation: "OKC", wins: 40, losses: 14, ppg: 119.8, oppPpg: 108.5, pace: 99.8, offRtg: 120.0, defRtg: 108.6, netRtg: 11.4, efgPct: 57.2, tovPct: 12.5, orbPct: 28.2, ftRate: 0.228 },
  { id: "5", name: "Cleveland Cavaliers", abbreviation: "CLE", wins: 37, losses: 17, ppg: 114.2, oppPpg: 107.8, pace: 97.5, offRtg: 117.0, defRtg: 110.5, netRtg: 6.5, efgPct: 56.2, tovPct: 11.5, orbPct: 27.5, ftRate: 0.205 },
  { id: "6", name: "Phoenix Suns", abbreviation: "PHX", wins: 32, losses: 22, ppg: 116.5, oppPpg: 114.2, pace: 100.2, offRtg: 116.2, defRtg: 113.8, netRtg: 2.4, efgPct: 55.8, tovPct: 13.8, orbPct: 23.8, ftRate: 0.218 },
  { id: "7", name: "Los Angeles Lakers", abbreviation: "LAL", wins: 30, losses: 24, ppg: 115.2, oppPpg: 113.5, pace: 99.5, offRtg: 115.8, defRtg: 114.0, netRtg: 1.8, efgPct: 54.8, tovPct: 14.2, orbPct: 26.2, ftRate: 0.235 },
  { id: "8", name: "Miami Heat", abbreviation: "MIA", wins: 28, losses: 26, ppg: 110.8, oppPpg: 110.2, pace: 96.8, offRtg: 114.4, defRtg: 113.8, netRtg: 0.6, efgPct: 53.5, tovPct: 12.8, orbPct: 24.2, ftRate: 0.198 },
];

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
  const [teams] = useState<TeamStats[]>(sampleTeams);
  const [selectedTeam, setSelectedTeam] = useState<TeamStats>(sampleTeams[0]);
  const [compareTeam, setCompareTeam] = useState<TeamStats | null>(null);
  const [sortBy, setSortBy] = useState<keyof TeamStats>("netRtg");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

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

          <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: "30px" }}>
            {/* Team Selector */}
            <div>
              <div className="section">
                <div className="section-title">Select Team</div>
                <select
                  value={selectedTeam.id}
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
                    {selectedTeam.abbreviation}
                  </div>
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
                </div>

                {/* Quick Stats */}
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
              </div>

              {/* Four Factors */}
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
                          background: selectedTeam.id === team.id ? "rgba(255, 107, 53, 0.15)" : "transparent",
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
        </div>
      </main>
      <Footer />
    </>
  );
}
