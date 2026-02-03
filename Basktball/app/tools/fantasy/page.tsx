"use client";

import { useState, useEffect, useCallback } from "react";
import { Header, Footer } from "@/components";

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  salary: number;
  projectedPts: number;
  value: number;
  status: "healthy" | "questionable" | "out";
}

// Sample players for demonstration
const samplePlayers: Player[] = [
  { id: "1", name: "LeBron James", position: "SF", team: "LAL", salary: 10500, projectedPts: 52.3, value: 4.98, status: "healthy" },
  { id: "2", name: "Stephen Curry", position: "PG", team: "GSW", salary: 10200, projectedPts: 49.8, value: 4.88, status: "healthy" },
  { id: "3", name: "Giannis Antetokounmpo", position: "PF", team: "MIL", salary: 11000, projectedPts: 55.2, value: 5.02, status: "healthy" },
  { id: "4", name: "Kevin Durant", position: "SF", team: "PHX", salary: 10300, projectedPts: 48.5, value: 4.71, status: "questionable" },
  { id: "5", name: "Nikola Jokic", position: "C", team: "DEN", salary: 11200, projectedPts: 58.1, value: 5.19, status: "healthy" },
  { id: "6", name: "Jayson Tatum", position: "SF", team: "BOS", salary: 9800, projectedPts: 46.2, value: 4.71, status: "healthy" },
  { id: "7", name: "Luka Doncic", position: "PG", team: "DAL", salary: 10800, projectedPts: 54.5, value: 5.05, status: "healthy" },
  { id: "8", name: "Joel Embiid", position: "C", team: "PHI", salary: 10900, projectedPts: 51.8, value: 4.75, status: "out" },
  { id: "9", name: "Damian Lillard", position: "PG", team: "MIL", salary: 9200, projectedPts: 42.5, value: 4.62, status: "healthy" },
  { id: "10", name: "Anthony Davis", position: "PF", team: "LAL", salary: 9500, projectedPts: 44.8, value: 4.72, status: "healthy" },
  { id: "11", name: "Ja Morant", position: "PG", team: "MEM", salary: 8800, projectedPts: 40.2, value: 4.57, status: "healthy" },
  { id: "12", name: "Devin Booker", position: "SG", team: "PHX", salary: 8600, projectedPts: 38.5, value: 4.48, status: "healthy" },
  { id: "13", name: "Trae Young", position: "PG", team: "ATL", salary: 8400, projectedPts: 41.2, value: 4.90, status: "healthy" },
  { id: "14", name: "Donovan Mitchell", position: "SG", team: "CLE", salary: 8200, projectedPts: 37.8, value: 4.61, status: "healthy" },
  { id: "15", name: "Bam Adebayo", position: "C", team: "MIA", salary: 7800, projectedPts: 35.5, value: 4.55, status: "healthy" },
];

const SALARY_CAP = 50000;
const POSITIONS = ["PG", "SG", "SF", "PF", "C"];

export default function FantasyPage() {
  const [players] = useState<Player[]>(samplePlayers);
  const [lineup, setLineup] = useState<(Player | null)[]>([null, null, null, null, null]);
  const [positionFilter, setPositionFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"projectedPts" | "salary" | "value">("value");
  const [showOnlyHealthy, setShowOnlyHealthy] = useState(false);

  const totalSalary = lineup.reduce((sum, p) => sum + (p?.salary || 0), 0);
  const totalProjected = lineup.reduce((sum, p) => sum + (p?.projectedPts || 0), 0);
  const remainingSalary = SALARY_CAP - totalSalary;

  const filteredPlayers = players
    .filter(p => {
      if (positionFilter !== "all" && p.position !== positionFilter) return false;
      if (showOnlyHealthy && p.status !== "healthy") return false;
      if (lineup.some(l => l?.id === p.id)) return false;
      return true;
    })
    .sort((a, b) => b[sortBy] - a[sortBy]);

  const addToLineup = (player: Player) => {
    const posIndex = POSITIONS.indexOf(player.position);
    if (posIndex === -1) return;

    // Check if position is already filled
    if (lineup[posIndex] !== null) return;

    // Check salary cap
    if (totalSalary + player.salary > SALARY_CAP) return;

    const newLineup = [...lineup];
    newLineup[posIndex] = player;
    setLineup(newLineup);
  };

  const removeFromLineup = (index: number) => {
    const newLineup = [...lineup];
    newLineup[index] = null;
    setLineup(newLineup);
  };

  const optimizeLineup = () => {
    // Simple greedy optimization by value
    const newLineup: (Player | null)[] = [null, null, null, null, null];
    let remainingCap = SALARY_CAP;

    POSITIONS.forEach((pos, idx) => {
      const eligible = players
        .filter(p => p.position === pos && p.status !== "out" && p.salary <= remainingCap)
        .sort((a, b) => b.value - a.value);

      if (eligible.length > 0) {
        newLineup[idx] = eligible[0];
        remainingCap -= eligible[0].salary;
      }
    });

    setLineup(newLineup);
  };

  const clearLineup = () => {
    setLineup([null, null, null, null, null]);
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
            FANTASY OPTIMIZER
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
            Maximize your fantasy lineup with smart player recommendations.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: "30px" }}>
            {/* Lineup Builder */}
            <div>
              <div className="section">
                <div className="section-title">Your Lineup</div>

                {/* Salary Cap Bar */}
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)" }}>Salary Used</span>
                    <span style={{
                      fontFamily: "var(--font-roboto-mono), monospace",
                      color: totalSalary > SALARY_CAP ? "var(--red)" : "inherit"
                    }}>
                      ${totalSalary.toLocaleString()} / ${SALARY_CAP.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{
                      width: `${Math.min(100, (totalSalary / SALARY_CAP) * 100)}%`,
                      height: "100%",
                      background: totalSalary > SALARY_CAP ? "var(--red)" : "var(--green)",
                      transition: "width 0.3s ease"
                    }} />
                  </div>
                  <div style={{ marginTop: "5px", fontSize: "14px", color: "rgba(255,255,255,0.5)" }}>
                    Remaining: ${remainingSalary.toLocaleString()}
                  </div>
                </div>

                {/* Lineup Slots */}
                {POSITIONS.map((pos, index) => (
                  <div key={pos} style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px",
                    background: "rgba(0,0,0,0.3)",
                    marginBottom: "8px",
                    border: lineup[index] ? "1px solid var(--green)" : "1px solid rgba(255,255,255,0.1)"
                  }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      background: "var(--orange)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      marginRight: "12px"
                    }}>
                      {pos}
                    </div>
                    {lineup[index] ? (
                      <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: "bold" }}>{lineup[index]?.name}</div>
                          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                            ${lineup[index]?.salary.toLocaleString()} | {lineup[index]?.projectedPts.toFixed(1)} pts
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromLineup(index)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--red)",
                            cursor: "pointer",
                            fontSize: "20px"
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: "rgba(255,255,255,0.3)" }}>Select player...</span>
                    )}
                  </div>
                ))}

                {/* Projected Points */}
                <div style={{
                  marginTop: "20px",
                  padding: "15px",
                  background: "rgba(16, 185, 129, 0.1)",
                  border: "1px solid var(--green)",
                  textAlign: "center"
                }}>
                  <div style={{ color: "rgba(255,255,255,0.5)", marginBottom: "5px" }}>Projected Points</div>
                  <div style={{
                    fontFamily: "var(--font-roboto-mono), monospace",
                    fontSize: "36px",
                    fontWeight: "bold",
                    color: "var(--green)"
                  }}>
                    {totalProjected.toFixed(1)}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                  <button onClick={optimizeLineup} className="btn" style={{ flex: 1, padding: "12px" }}>
                    AUTO-OPTIMIZE
                  </button>
                  <button onClick={clearLineup} style={{
                    flex: 1,
                    padding: "12px",
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "var(--white)",
                    cursor: "pointer"
                  }}>
                    CLEAR
                  </button>
                </div>
              </div>
            </div>

            {/* Player Pool */}
            <div className="section">
              <div className="section-title">Player Pool</div>

              {/* Filters */}
              <div style={{ display: "flex", gap: "15px", marginBottom: "20px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: "5px" }}>
                  <button
                    onClick={() => setPositionFilter("all")}
                    style={{
                      padding: "8px 15px",
                      background: positionFilter === "all" ? "var(--orange)" : "transparent",
                      border: "1px solid",
                      borderColor: positionFilter === "all" ? "var(--orange)" : "rgba(255,255,255,0.2)",
                      color: "var(--white)",
                      cursor: "pointer"
                    }}
                  >
                    ALL
                  </button>
                  {POSITIONS.map(pos => (
                    <button
                      key={pos}
                      onClick={() => setPositionFilter(pos)}
                      style={{
                        padding: "8px 15px",
                        background: positionFilter === pos ? "var(--orange)" : "transparent",
                        border: "1px solid",
                        borderColor: positionFilter === pos ? "var(--orange)" : "rgba(255,255,255,0.2)",
                        color: "var(--white)",
                        cursor: "pointer"
                      }}
                    >
                      {pos}
                    </button>
                  ))}
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  style={{
                    padding: "8px 15px",
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "var(--white)"
                  }}
                >
                  <option value="value">Sort by Value</option>
                  <option value="projectedPts">Sort by Projected</option>
                  <option value="salary">Sort by Salary</option>
                </select>

                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={showOnlyHealthy}
                    onChange={(e) => setShowOnlyHealthy(e.target.checked)}
                  />
                  <span style={{ fontSize: "14px" }}>Healthy only</span>
                </label>
              </div>

              {/* Player Table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--orange)" }}>
                      <th style={{ padding: "12px", textAlign: "left" }}>Player</th>
                      <th style={{ padding: "12px", textAlign: "center" }}>Pos</th>
                      <th style={{ padding: "12px", textAlign: "center" }}>Team</th>
                      <th style={{ padding: "12px", textAlign: "right" }}>Salary</th>
                      <th style={{ padding: "12px", textAlign: "right" }}>Proj</th>
                      <th style={{ padding: "12px", textAlign: "right" }}>Value</th>
                      <th style={{ padding: "12px", textAlign: "center" }}>Status</th>
                      <th style={{ padding: "12px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlayers.map(player => {
                      const posIndex = POSITIONS.indexOf(player.position);
                      const canAdd = lineup[posIndex] === null && totalSalary + player.salary <= SALARY_CAP && player.status !== "out";

                      return (
                        <tr key={player.id} style={{
                          borderBottom: "1px solid rgba(255,255,255,0.1)",
                          opacity: player.status === "out" ? 0.5 : 1
                        }}>
                          <td style={{ padding: "12px", fontWeight: "bold" }}>{player.name}</td>
                          <td style={{ padding: "12px", textAlign: "center" }}>{player.position}</td>
                          <td style={{ padding: "12px", textAlign: "center" }}>{player.team}</td>
                          <td style={{ padding: "12px", textAlign: "right", fontFamily: "var(--font-roboto-mono), monospace" }}>
                            ${player.salary.toLocaleString()}
                          </td>
                          <td style={{ padding: "12px", textAlign: "right", fontFamily: "var(--font-roboto-mono), monospace" }}>
                            {player.projectedPts.toFixed(1)}
                          </td>
                          <td style={{
                            padding: "12px",
                            textAlign: "right",
                            fontFamily: "var(--font-roboto-mono), monospace",
                            color: player.value >= 5 ? "var(--green)" : player.value >= 4.5 ? "var(--yellow)" : "inherit"
                          }}>
                            {player.value.toFixed(2)}
                          </td>
                          <td style={{ padding: "12px", textAlign: "center" }}>
                            <span style={{
                              padding: "4px 8px",
                              fontSize: "12px",
                              borderRadius: "4px",
                              background: player.status === "healthy" ? "rgba(16, 185, 129, 0.2)" :
                                player.status === "questionable" ? "rgba(245, 158, 11, 0.2)" : "rgba(239, 68, 68, 0.2)",
                              color: player.status === "healthy" ? "var(--green)" :
                                player.status === "questionable" ? "var(--yellow)" : "var(--red)"
                            }}>
                              {player.status.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: "12px" }}>
                            <button
                              onClick={() => addToLineup(player)}
                              disabled={!canAdd}
                              style={{
                                padding: "6px 12px",
                                background: canAdd ? "var(--green)" : "rgba(255,255,255,0.1)",
                                border: "none",
                                color: canAdd ? "var(--white)" : "rgba(255,255,255,0.3)",
                                cursor: canAdd ? "pointer" : "not-allowed",
                                fontSize: "12px"
                              }}
                            >
                              ADD
                            </button>
                          </td>
                        </tr>
                      );
                    })}
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
