"use client";

import { useState, useEffect } from "react";
import { Header, Footer } from "@/components";

interface HistoricalRecord {
  id?: string;
  category: string;
  record: string;
  holder: string;
  date: string;
  details?: string;
}

interface Season {
  id?: string;
  year: string;
  champion: string;
  mvp: string;
  finalsScore: string;
  topScorer: string;
  topScorerPpg: number;
}

interface ChampionshipCount {
  team: string;
  count: number;
  lastWon: string;
}

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<"records" | "seasons" | "championships">("records");
  const [searchQuery, setSearchQuery] = useState("");
  const [records, setRecords] = useState<HistoricalRecord[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [championships, setChampionships] = useState<ChampionshipCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [recordsRes, seasonsRes, championshipsRes] = await Promise.all([
          fetch("/api/history/records"),
          fetch("/api/history/seasons"),
          fetch("/api/history/championships"),
        ]);

        const recordsData = await recordsRes.json();
        const seasonsData = await seasonsRes.json();
        const championshipsData = await championshipsRes.json();

        if (recordsData.success) setRecords(recordsData.records || []);
        if (seasonsData.success) setSeasons(seasonsData.seasons || []);
        if (championshipsData.success) setChampionships(championshipsData.championships || []);
      } catch (error) {
        console.error("Error fetching history data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredRecords = records.filter(r =>
    r.holder.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            HISTORICAL DATABASE
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
            Access decades of basketball history with records, champions, and legendary performances.
          </p>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "30px" }}>
            <button
              onClick={() => setActiveTab("records")}
              style={{
                padding: "12px 30px",
                background: activeTab === "records" ? "var(--orange)" : "transparent",
                border: "1px solid",
                borderColor: activeTab === "records" ? "var(--orange)" : "rgba(255,255,255,0.2)",
                color: "var(--white)",
                cursor: "pointer",
                fontFamily: "var(--font-anton), Anton, sans-serif",
                fontSize: "16px"
              }}
            >
              ALL-TIME RECORDS
            </button>
            <button
              onClick={() => setActiveTab("seasons")}
              style={{
                padding: "12px 30px",
                background: activeTab === "seasons" ? "var(--orange)" : "transparent",
                border: "1px solid",
                borderColor: activeTab === "seasons" ? "var(--orange)" : "rgba(255,255,255,0.2)",
                color: "var(--white)",
                cursor: "pointer",
                fontFamily: "var(--font-anton), Anton, sans-serif",
                fontSize: "16px"
              }}
            >
              SEASON HISTORY
            </button>
            <button
              onClick={() => setActiveTab("championships")}
              style={{
                padding: "12px 30px",
                background: activeTab === "championships" ? "var(--orange)" : "transparent",
                border: "1px solid",
                borderColor: activeTab === "championships" ? "var(--orange)" : "rgba(255,255,255,0.2)",
                color: "var(--white)",
                cursor: "pointer",
                fontFamily: "var(--font-anton), Anton, sans-serif",
                fontSize: "16px"
              }}
            >
              CHAMPIONSHIPS
            </button>
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
              <p style={{ color: "rgba(255,255,255,0.6)" }}>Loading historical data...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (
          <>
          {activeTab === "records" && (
            <div className="section">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div className="section-title" style={{ marginBottom: 0 }}>All-Time NBA Records</div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search records..."
                  style={{
                    padding: "10px 15px",
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "var(--white)",
                    width: "250px"
                  }}
                />
              </div>

              {filteredRecords.length === 0 ? (
                <p style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", padding: "40px 0" }}>
                  No records found. Historical records can be managed from the admin panel.
                </p>
              ) : (
              <div style={{ display: "grid", gap: "15px" }}>
                {filteredRecords.map((record, index) => (
                  <div key={index} style={{
                    display: "grid",
                    gridTemplateColumns: "250px 150px 1fr auto",
                    gap: "20px",
                    alignItems: "center",
                    padding: "20px",
                    background: "rgba(0,0,0,0.3)",
                    borderLeft: "4px solid var(--orange)"
                  }}>
                    <div>
                      <div style={{ fontWeight: "bold", color: "var(--orange)" }}>{record.category}</div>
                    </div>
                    <div style={{
                      fontFamily: "var(--font-roboto-mono), monospace",
                      fontSize: "24px",
                      fontWeight: "bold"
                    }}>
                      {record.record}
                    </div>
                    <div>
                      <div style={{ fontWeight: "bold" }}>{record.holder}</div>
                      <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)" }}>{record.details}</div>
                    </div>
                    <div style={{
                      padding: "6px 12px",
                      background: "rgba(255,255,255,0.1)",
                      fontSize: "14px"
                    }}>
                      {record.date}
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
          )}

          {activeTab === "seasons" && (
            <div className="section">
              <div className="section-title">Recent NBA Seasons</div>
              {seasons.length === 0 ? (
                <p style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", padding: "40px 0" }}>
                  No season history found. Season data can be managed from the admin panel.
                </p>
              ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--orange)" }}>
                    <th style={{ padding: "15px", textAlign: "left" }}>Season</th>
                    <th style={{ padding: "15px", textAlign: "left" }}>Champion</th>
                    <th style={{ padding: "15px", textAlign: "center" }}>Finals</th>
                    <th style={{ padding: "15px", textAlign: "left" }}>MVP</th>
                    <th style={{ padding: "15px", textAlign: "left" }}>Scoring Leader</th>
                  </tr>
                </thead>
                <tbody>
                  {seasons.map((season, index) => (
                    <tr key={index} style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                      <td style={{
                        padding: "15px",
                        fontFamily: "var(--font-roboto-mono), monospace",
                        fontWeight: "bold",
                        color: "var(--orange)"
                      }}>
                        {season.year}
                      </td>
                      <td style={{ padding: "15px", fontWeight: "bold" }}>
                        {season.champion}
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--yellow)" style={{ marginLeft: "8px", verticalAlign: "middle" }}>
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      </td>
                      <td style={{ padding: "15px", textAlign: "center" }}>{season.finalsScore}</td>
                      <td style={{ padding: "15px" }}>{season.mvp}</td>
                      <td style={{ padding: "15px" }}>
                        {season.topScorer}
                        <span style={{
                          marginLeft: "10px",
                          fontFamily: "var(--font-roboto-mono), monospace",
                          color: "var(--green)"
                        }}>
                          {season.topScorerPpg} PPG
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
          )}

          {activeTab === "championships" && (
            <div className="section">
              <div className="section-title">All-Time Championship Leaders</div>
              {championships.length === 0 ? (
                <p style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", padding: "40px 0" }}>
                  No championship data found.
                </p>
              ) : (
              <div style={{ display: "grid", gap: "15px" }}>
                {championships.map((team, index) => (
                  <div key={team.team} style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "20px",
                    background: "rgba(0,0,0,0.3)",
                    borderLeft: index === 0 ? "4px solid var(--yellow)" : index === 1 ? "4px solid #C0C0C0" : index === 2 ? "4px solid #CD7F32" : "4px solid transparent"
                  }}>
                    <div style={{
                      width: "50px",
                      height: "50px",
                      background: index === 0 ? "var(--yellow)" : index === 1 ? "#C0C0C0" : index === 2 ? "#CD7F32" : "rgba(255,255,255,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      fontFamily: "var(--font-roboto-mono), monospace",
                      fontSize: "20px",
                      color: index < 3 ? "var(--black)" : "var(--white)",
                      marginRight: "20px"
                    }}>
                      {index + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "bold", fontSize: "18px" }}>{team.team}</div>
                      <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)" }}>
                        Last championship: {team.lastWon}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{
                        fontFamily: "var(--font-roboto-mono), monospace",
                        fontSize: "36px",
                        fontWeight: "bold",
                        color: "var(--orange)"
                      }}>
                        {team.count}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "3px", maxWidth: "120px" }}>
                        {Array.from({ length: Math.min(team.count, 18) }).map((_, i) => (
                          <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="var(--yellow)">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
          )}
          </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
