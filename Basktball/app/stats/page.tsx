"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header, Footer } from "@/components";

type StatCategory = "ppg" | "rpg" | "apg" | "spg" | "bpg" | "fg_pct" | "three_pct";

interface Leader {
  rank: number;
  playerId: string;
  name: string;
  team: string;
  teamName: string;
  value: number;
  gamesPlayed: number;
}

const categories: { id: StatCategory; name: string; label: string }[] = [
  { id: "ppg", name: "Points", label: "PPG" },
  { id: "rpg", name: "Rebounds", label: "RPG" },
  { id: "apg", name: "Assists", label: "APG" },
  { id: "spg", name: "Steals", label: "SPG" },
  { id: "bpg", name: "Blocks", label: "BPG" },
  { id: "fg_pct", name: "Field Goal %", label: "FG%" },
  { id: "three_pct", name: "3-Point %", label: "3P%" },
];

export default function StatsPage() {
  const [category, setCategory] = useState<StatCategory>("ppg");
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaders() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/stats/leaders?category=${category}&limit=25`);
        const data = await res.json();
        if (data.success) {
          setLeaders(data.leaders);
        } else {
          setError(data.error || "Failed to load stats");
        }
      } catch {
        setError("Failed to connect to server");
      } finally {
        setIsLoading(false);
      }
    }
    fetchLeaders();
  }, [category]);

  const currentCategory = categories.find(c => c.id === category);

  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {/* Page Header */}
          <h1 style={{
            fontFamily: "var(--font-anton), Anton, sans-serif",
            fontSize: "48px",
            marginBottom: "40px",
            textAlign: "center"
          }}>
            STAT LEADERS
            <span style={{
              display: "block",
              width: "100px",
              height: "4px",
              background: "var(--orange)",
              margin: "15px auto 0"
            }}></span>
          </h1>

          {/* Category Tabs */}
          <div style={{
            display: "flex",
            gap: "10px",
            marginBottom: "40px",
            flexWrap: "wrap",
            justifyContent: "center"
          }}>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                style={{
                  padding: "12px 24px",
                  background: category === cat.id ? "var(--orange)" : "var(--dark-gray)",
                  border: "2px solid",
                  borderColor: category === cat.id ? "var(--orange)" : "rgba(255,255,255,0.1)",
                  color: "var(--white)",
                  fontFamily: "var(--font-barlow), sans-serif",
                  fontSize: "14px",
                  fontWeight: "600",
                  letterSpacing: "1px",
                  cursor: "pointer",
                  transition: "all 0.3s ease"
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Leaders Table */}
          <div className="section">
            <div className="section-title">
              {currentCategory?.name} Leaders
            </div>

            {isLoading ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading stats...</p>
              </div>
            ) : error ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <p style={{ color: "var(--red)" }}>{error}</p>
              </div>
            ) : leaders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <p style={{ color: "rgba(255,255,255,0.5)" }}>No stats available yet.</p>
              </div>
            ) : (
              <table className="jobs-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th style={{ width: "60px" }}>RANK</th>
                    <th>PLAYER</th>
                    <th>TEAM</th>
                    <th style={{ width: "80px" }}>GP</th>
                    <th style={{ width: "100px", textAlign: "right" }}>{currentCategory?.label}</th>
                  </tr>
                </thead>
                <tbody>
                  {leaders.map(leader => (
                    <tr
                      key={leader.playerId}
                      style={{ cursor: "pointer" }}
                      onClick={() => window.location.href = `/player/${leader.playerId}`}
                    >
                      <td style={{
                        fontFamily: "var(--font-roboto-mono), monospace",
                        fontWeight: "bold",
                        color: leader.rank <= 3 ? "var(--orange)" : "inherit"
                      }}>
                        {leader.rank}
                      </td>
                      <td>
                        <Link
                          href={`/player/${leader.playerId}`}
                          style={{
                            fontWeight: "600",
                            color: "inherit",
                            textDecoration: "none",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {leader.name}
                        </Link>
                      </td>
                      <td style={{ color: "rgba(255,255,255,0.6)" }}>{leader.teamName}</td>
                      <td style={{
                        fontFamily: "var(--font-roboto-mono), monospace",
                        color: "rgba(255,255,255,0.5)"
                      }}>
                        {leader.gamesPlayed}
                      </td>
                      <td style={{
                        fontFamily: "var(--font-roboto-mono), monospace",
                        fontWeight: "bold",
                        fontSize: "18px",
                        textAlign: "right",
                        color: leader.rank === 1 ? "var(--orange)" : "inherit"
                      }}>
                        {category === "fg_pct" || category === "three_pct"
                          ? `${leader.value.toFixed(1)}%`
                          : leader.value.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
