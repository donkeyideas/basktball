"use client";

import { useState } from "react";
import { Header, Footer } from "@/components";

interface HistoricalRecord {
  category: string;
  record: string;
  holder: string;
  date: string;
  details: string;
}

interface Season {
  year: string;
  champion: string;
  mvp: string;
  finalsScore: string;
  topScorer: { name: string; ppg: number };
}

// Sample historical data
const allTimeRecords: HistoricalRecord[] = [
  { category: "Career Points", record: "38,387", holder: "LeBron James", date: "Active", details: "Passed Kareem Abdul-Jabbar on Feb 7, 2023" },
  { category: "Career Assists", record: "15,806", holder: "John Stockton", date: "1984-2003", details: "3,715 more than second place" },
  { category: "Career Rebounds", record: "23,924", holder: "Wilt Chamberlain", date: "1959-1973", details: "Also holds single-game record (55)" },
  { category: "Career Steals", record: "3,265", holder: "John Stockton", date: "1984-2003", details: "581 more than second place" },
  { category: "Career Blocks", record: "3,830", holder: "Hakeem Olajuwon", date: "1984-2002", details: "Also a dominant scorer" },
  { category: "Single Game Points", record: "100", holder: "Wilt Chamberlain", date: "Mar 2, 1962", details: "vs. New York Knicks" },
  { category: "Single Season PPG", record: "50.4", holder: "Wilt Chamberlain", date: "1961-62", details: "Also averaged 25.7 RPG" },
  { category: "Career 3-Pointers", record: "3,747", holder: "Stephen Curry", date: "Active", details: "Changed the game" },
  { category: "Single Season 3PM", record: "402", holder: "Stephen Curry", date: "2015-16", details: "On 45.4% shooting" },
  { category: "Triple-Doubles (Career)", record: "194", holder: "Russell Westbrook", date: "Active", details: "Passed Oscar Robertson in 2021" },
];

const recentSeasons: Season[] = [
  { year: "2023-24", champion: "Boston Celtics", mvp: "Nikola Jokic", finalsScore: "4-1 vs Dallas", topScorer: { name: "Luka Doncic", ppg: 33.9 } },
  { year: "2022-23", champion: "Denver Nuggets", mvp: "Joel Embiid", finalsScore: "4-1 vs Miami", topScorer: { name: "Joel Embiid", ppg: 33.1 } },
  { year: "2021-22", champion: "Golden State Warriors", mvp: "Nikola Jokic", finalsScore: "4-2 vs Boston", topScorer: { name: "Joel Embiid", ppg: 30.6 } },
  { year: "2020-21", champion: "Milwaukee Bucks", mvp: "Nikola Jokic", finalsScore: "4-2 vs Phoenix", topScorer: { name: "Stephen Curry", ppg: 32.0 } },
  { year: "2019-20", champion: "Los Angeles Lakers", mvp: "Giannis Antetokounmpo", finalsScore: "4-2 vs Miami", topScorer: { name: "James Harden", ppg: 34.3 } },
];

interface ChampionshipCount {
  team: string;
  count: number;
  lastWon: string;
}

const championshipCounts: ChampionshipCount[] = [
  { team: "Boston Celtics", count: 18, lastWon: "2024" },
  { team: "Los Angeles Lakers", count: 17, lastWon: "2020" },
  { team: "Golden State Warriors", count: 7, lastWon: "2022" },
  { team: "Chicago Bulls", count: 6, lastWon: "1998" },
  { team: "San Antonio Spurs", count: 5, lastWon: "2014" },
  { team: "Miami Heat", count: 3, lastWon: "2013" },
  { team: "Detroit Pistons", count: 3, lastWon: "2004" },
  { team: "Philadelphia 76ers", count: 3, lastWon: "1983" },
];

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<"records" | "seasons" | "championships">("records");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRecords = allTimeRecords.filter(r =>
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
            </div>
          )}

          {activeTab === "seasons" && (
            <div className="section">
              <div className="section-title">Recent NBA Seasons</div>
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
                  {recentSeasons.map((season, index) => (
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
                        {season.topScorer.name}
                        <span style={{
                          marginLeft: "10px",
                          fontFamily: "var(--font-roboto-mono), monospace",
                          color: "var(--green)"
                        }}>
                          {season.topScorer.ppg} PPG
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "championships" && (
            <div className="section">
              <div className="section-title">All-Time Championship Leaders</div>
              <div style={{ display: "grid", gap: "15px" }}>
                {championshipCounts.map((team, index) => (
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
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
