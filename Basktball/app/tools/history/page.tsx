"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header, Footer } from "@/components";
import {
  getTeamLogoUrl,
  getTeamPageUrl,
  getPlayerHeadshotUrl,
  getPlayerPageUrl,
} from "@/lib/utils/nba-mappings";

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

  // Expandable row state
  const [expandedRecord, setExpandedRecord] = useState<number | null>(null);
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null);
  const [expandedChamp, setExpandedChamp] = useState<number | null>(null);

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

  // Find championship years for a team from season data
  function getChampionshipYears(teamName: string): string[] {
    return seasons
      .filter(s => s.champion === teamName)
      .map(s => s.year);
  }

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
          <div style={{ display: "flex", gap: "10px", marginBottom: "30px", flexWrap: "wrap" }}>
            {[
              { key: "records" as const, label: "ALL-TIME RECORDS" },
              { key: "seasons" as const, label: "SEASON HISTORY" },
              { key: "championships" as const, label: "CHAMPIONSHIPS" },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: "12px 30px",
                  background: activeTab === tab.key ? "var(--orange)" : "transparent",
                  border: "1px solid",
                  borderColor: activeTab === tab.key ? "var(--orange)" : "rgba(255,255,255,0.2)",
                  color: "var(--white)",
                  cursor: "pointer",
                  fontFamily: "var(--font-anton), Anton, sans-serif",
                  fontSize: "16px"
                }}
              >
                {tab.label}
              </button>
            ))}
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
          {/* ==================== ALL-TIME RECORDS ==================== */}
          {activeTab === "records" && (
            <div className="section">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "15px" }}>
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
                {filteredRecords.map((record, index) => {
                  const isExpanded = expandedRecord === index;
                  const headshotUrl = getPlayerHeadshotUrl(record.holder);
                  const playerUrl = getPlayerPageUrl(record.holder);

                  return (
                    <div key={index}>
                      <div
                        onClick={() => setExpandedRecord(isExpanded ? null : index)}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "250px 150px 1fr auto",
                          gap: "20px",
                          alignItems: "center",
                          padding: "20px",
                          background: isExpanded ? "rgba(255,107,0,0.1)" : "rgba(0,0,0,0.3)",
                          borderLeft: "4px solid var(--orange)",
                          cursor: "pointer",
                          transition: "background 0.2s",
                        }}
                      >
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
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          {headshotUrl && (
                            <div style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              overflow: "hidden",
                              flexShrink: 0,
                              background: "rgba(255,255,255,0.1)",
                            }}>
                              <img
                                src={headshotUrl}
                                alt={record.holder}
                                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              />
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: "bold" }}>{record.holder}</div>
                            <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)" }}>{record.details}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{
                            padding: "6px 12px",
                            background: "rgba(255,255,255,0.1)",
                            fontSize: "14px"
                          }}>
                            {record.date}
                          </div>
                          <svg
                            width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="rgba(255,255,255,0.5)" strokeWidth="2"
                            style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </div>
                      </div>

                      {/* Expanded Detail */}
                      {isExpanded && (
                        <div style={{
                          padding: "25px 30px",
                          background: "rgba(0,0,0,0.5)",
                          borderLeft: "4px solid var(--orange)",
                          borderTop: "1px solid rgba(255,107,0,0.2)",
                        }}>
                          <div style={{ display: "flex", gap: "30px", alignItems: "flex-start" }}>
                            {headshotUrl && (
                              <div style={{
                                width: "100px",
                                height: "75px",
                                borderRadius: "8px",
                                overflow: "hidden",
                                flexShrink: 0,
                                background: "rgba(255,255,255,0.05)",
                              }}>
                                <img
                                  src={headshotUrl}
                                  alt={record.holder}
                                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
                                  onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
                                />
                              </div>
                            )}
                            <div style={{ flex: 1 }}>
                              <h3 style={{
                                fontFamily: "var(--font-anton), Anton, sans-serif",
                                fontSize: "24px",
                                marginBottom: "8px",
                              }}>
                                {record.holder}
                              </h3>
                              <div style={{
                                display: "flex",
                                gap: "20px",
                                marginBottom: "15px",
                                flexWrap: "wrap",
                              }}>
                                <div style={{
                                  padding: "8px 16px",
                                  background: "rgba(255,107,0,0.15)",
                                  border: "1px solid rgba(255,107,0,0.3)",
                                }}>
                                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", display: "block" }}>RECORD</span>
                                  <span style={{ fontFamily: "var(--font-roboto-mono), monospace", fontSize: "20px", fontWeight: "bold", color: "var(--orange)" }}>{record.record}</span>
                                </div>
                                <div style={{
                                  padding: "8px 16px",
                                  background: "rgba(255,255,255,0.05)",
                                  border: "1px solid rgba(255,255,255,0.1)",
                                }}>
                                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", display: "block" }}>CATEGORY</span>
                                  <span style={{ fontWeight: "bold" }}>{record.category}</span>
                                </div>
                                <div style={{
                                  padding: "8px 16px",
                                  background: "rgba(255,255,255,0.05)",
                                  border: "1px solid rgba(255,255,255,0.1)",
                                }}>
                                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", display: "block" }}>DATE</span>
                                  <span style={{ fontWeight: "bold" }}>{record.date}</span>
                                </div>
                              </div>
                              {record.details && (
                                <p style={{ color: "rgba(255,255,255,0.7)", lineHeight: "1.6", marginBottom: "15px" }}>
                                  {record.details}
                                </p>
                              )}
                              {playerUrl && (
                                <Link href={playerUrl} style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  padding: "10px 20px",
                                  background: "var(--orange)",
                                  color: "var(--white)",
                                  textDecoration: "none",
                                  fontFamily: "var(--font-anton), Anton, sans-serif",
                                  fontSize: "14px",
                                }}>
                                  VIEW PLAYER PROFILE
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                  </svg>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              )}
            </div>
          )}

          {/* ==================== SEASON HISTORY ==================== */}
          {activeTab === "seasons" && (
            <div className="section">
              <div className="section-title">Recent NBA Seasons</div>
              {seasons.length === 0 ? (
                <p style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", padding: "40px 0" }}>
                  No season history found. Season data can be managed from the admin panel.
                </p>
              ) : (
              <div style={{ display: "grid", gap: "0" }}>
                {/* Table Header */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "100px 1fr 130px 1fr 1fr",
                  gap: "15px",
                  padding: "15px 20px",
                  borderBottom: "2px solid var(--orange)",
                  fontWeight: "bold",
                  fontSize: "14px",
                  color: "rgba(255,255,255,0.6)",
                }}>
                  <div>Season</div>
                  <div>Champion</div>
                  <div style={{ textAlign: "center" }}>Finals</div>
                  <div>MVP</div>
                  <div>Scoring Leader</div>
                </div>

                {seasons.map((season, index) => {
                  const isExpanded = expandedSeason === index;
                  const champLogoUrl = getTeamLogoUrl(season.champion);
                  const champPageUrl = getTeamPageUrl(season.champion);
                  const mvpHeadshotUrl = getPlayerHeadshotUrl(season.mvp);
                  const mvpPageUrl = getPlayerPageUrl(season.mvp);
                  const scorerHeadshotUrl = getPlayerHeadshotUrl(season.topScorer);
                  const scorerPageUrl = getPlayerPageUrl(season.topScorer);

                  return (
                    <div key={index}>
                      <div
                        onClick={() => setExpandedSeason(isExpanded ? null : index)}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "100px 1fr 130px 1fr 1fr",
                          gap: "15px",
                          alignItems: "center",
                          padding: "15px 20px",
                          borderBottom: "1px solid rgba(255,255,255,0.1)",
                          cursor: "pointer",
                          background: isExpanded ? "rgba(255,107,0,0.08)" : "transparent",
                          transition: "background 0.2s",
                        }}
                      >
                        <div style={{
                          fontFamily: "var(--font-roboto-mono), monospace",
                          fontWeight: "bold",
                          color: "var(--orange)"
                        }}>
                          {season.year}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {champLogoUrl && (
                            <img
                              src={champLogoUrl}
                              alt={season.champion}
                              style={{ width: "24px", height: "24px", objectFit: "contain" }}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          )}
                          <span style={{ fontWeight: "bold" }}>{season.champion}</span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--yellow)" style={{ flexShrink: 0 }}>
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        </div>
                        <div style={{ textAlign: "center", fontSize: "14px" }}>{season.finalsScore}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {mvpHeadshotUrl && (
                            <div style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "50%",
                              overflow: "hidden",
                              flexShrink: 0,
                              background: "rgba(255,255,255,0.1)",
                            }}>
                              <img
                                src={mvpHeadshotUrl}
                                alt={season.mvp}
                                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              />
                            </div>
                          )}
                          <span>{season.mvp}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {scorerHeadshotUrl && (
                            <div style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "50%",
                              overflow: "hidden",
                              flexShrink: 0,
                              background: "rgba(255,255,255,0.1)",
                            }}>
                              <img
                                src={scorerHeadshotUrl}
                                alt={season.topScorer}
                                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              />
                            </div>
                          )}
                          <span>{season.topScorer}</span>
                          <span style={{
                            fontFamily: "var(--font-roboto-mono), monospace",
                            color: "var(--green)",
                            fontSize: "13px",
                          }}>
                            {season.topScorerPpg} PPG
                          </span>
                        </div>
                      </div>

                      {/* Expanded Detail */}
                      {isExpanded && (
                        <div style={{
                          padding: "25px 30px",
                          background: "rgba(0,0,0,0.5)",
                          borderBottom: "1px solid rgba(255,107,0,0.2)",
                        }}>
                          <div style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            gap: "25px",
                          }}>
                            {/* Champion Column */}
                            <div style={{
                              padding: "20px",
                              background: "rgba(255,255,255,0.03)",
                              border: "1px solid rgba(255,255,255,0.08)",
                            }}>
                              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "12px", fontWeight: "bold" }}>
                                CHAMPION
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "15px" }}>
                                {champLogoUrl && (
                                  <img
                                    src={champLogoUrl}
                                    alt={season.champion}
                                    style={{ width: "50px", height: "50px", objectFit: "contain" }}
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                  />
                                )}
                                <div>
                                  <div style={{ fontFamily: "var(--font-anton), Anton, sans-serif", fontSize: "20px" }}>
                                    {season.champion}
                                  </div>
                                  <div style={{ color: "var(--orange)", fontSize: "14px", fontWeight: "bold" }}>
                                    {season.finalsScore}
                                  </div>
                                </div>
                              </div>
                              {/* Finals visualization */}
                              {season.finalsScore && (() => {
                                const match = season.finalsScore.match(/(\d)-(\d)/);
                                if (!match) return null;
                                const wins = parseInt(match[1]);
                                const losses = parseInt(match[2]);
                                return (
                                  <div style={{ marginBottom: "15px" }}>
                                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "6px" }}>FINALS SERIES</div>
                                    <div style={{ display: "flex", gap: "6px" }}>
                                      {Array.from({ length: wins }).map((_, i) => (
                                        <div key={`w${i}`} style={{ width: "24px", height: "24px", background: "var(--green)", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold" }}>W</div>
                                      ))}
                                      {Array.from({ length: losses }).map((_, i) => (
                                        <div key={`l${i}`} style={{ width: "24px", height: "24px", background: "var(--red)", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold" }}>L</div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}
                              {champPageUrl && (
                                <Link href={champPageUrl} style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  color: "var(--orange)",
                                  textDecoration: "none",
                                  fontSize: "14px",
                                  fontWeight: "bold",
                                }}>
                                  View Team
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                  </svg>
                                </Link>
                              )}
                            </div>

                            {/* MVP Column */}
                            <div style={{
                              padding: "20px",
                              background: "rgba(255,255,255,0.03)",
                              border: "1px solid rgba(255,255,255,0.08)",
                            }}>
                              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "12px", fontWeight: "bold" }}>
                                SEASON MVP
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "15px" }}>
                                {mvpHeadshotUrl && (
                                  <div style={{
                                    width: "60px",
                                    height: "60px",
                                    borderRadius: "50%",
                                    overflow: "hidden",
                                    flexShrink: 0,
                                    background: "rgba(255,255,255,0.1)",
                                  }}>
                                    <img
                                      src={mvpHeadshotUrl}
                                      alt={season.mvp}
                                      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
                                      onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
                                    />
                                  </div>
                                )}
                                <div>
                                  <div style={{ fontFamily: "var(--font-anton), Anton, sans-serif", fontSize: "20px" }}>
                                    {season.mvp}
                                  </div>
                                  <div style={{
                                    padding: "4px 8px",
                                    background: "rgba(255,215,0,0.15)",
                                    border: "1px solid rgba(255,215,0,0.3)",
                                    display: "inline-block",
                                    fontSize: "12px",
                                    color: "var(--yellow)",
                                    fontWeight: "bold",
                                    marginTop: "4px",
                                  }}>
                                    MVP AWARD
                                  </div>
                                </div>
                              </div>
                              {mvpPageUrl && (
                                <Link href={mvpPageUrl} style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  color: "var(--orange)",
                                  textDecoration: "none",
                                  fontSize: "14px",
                                  fontWeight: "bold",
                                }}>
                                  View Player
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                  </svg>
                                </Link>
                              )}
                            </div>

                            {/* Scoring Leader Column */}
                            <div style={{
                              padding: "20px",
                              background: "rgba(255,255,255,0.03)",
                              border: "1px solid rgba(255,255,255,0.08)",
                            }}>
                              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "12px", fontWeight: "bold" }}>
                                SCORING LEADER
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "15px" }}>
                                {scorerHeadshotUrl && (
                                  <div style={{
                                    width: "60px",
                                    height: "60px",
                                    borderRadius: "50%",
                                    overflow: "hidden",
                                    flexShrink: 0,
                                    background: "rgba(255,255,255,0.1)",
                                  }}>
                                    <img
                                      src={scorerHeadshotUrl}
                                      alt={season.topScorer}
                                      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
                                      onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
                                    />
                                  </div>
                                )}
                                <div>
                                  <div style={{ fontFamily: "var(--font-anton), Anton, sans-serif", fontSize: "20px" }}>
                                    {season.topScorer}
                                  </div>
                                  <div style={{
                                    fontFamily: "var(--font-roboto-mono), monospace",
                                    fontSize: "24px",
                                    fontWeight: "bold",
                                    color: "var(--green)",
                                    marginTop: "4px",
                                  }}>
                                    {season.topScorerPpg} PPG
                                  </div>
                                </div>
                              </div>
                              {scorerPageUrl && (
                                <Link href={scorerPageUrl} style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  color: "var(--orange)",
                                  textDecoration: "none",
                                  fontSize: "14px",
                                  fontWeight: "bold",
                                }}>
                                  View Player
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                  </svg>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              )}
            </div>
          )}

          {/* ==================== CHAMPIONSHIPS ==================== */}
          {activeTab === "championships" && (
            <div className="section">
              <div className="section-title">All-Time Championship Leaders</div>
              {championships.length === 0 ? (
                <p style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", padding: "40px 0" }}>
                  No championship data found.
                </p>
              ) : (
              <div style={{ display: "grid", gap: "15px" }}>
                {championships.map((team, index) => {
                  const isExpanded = expandedChamp === index;
                  const logoUrl = getTeamLogoUrl(team.team);
                  const teamPageUrl = getTeamPageUrl(team.team);
                  const champYears = getChampionshipYears(team.team);

                  return (
                    <div key={team.team}>
                      <div
                        onClick={() => setExpandedChamp(isExpanded ? null : index)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "20px",
                          background: isExpanded ? "rgba(255,107,0,0.1)" : "rgba(0,0,0,0.3)",
                          borderLeft: index === 0 ? "4px solid var(--yellow)" : index === 1 ? "4px solid #C0C0C0" : index === 2 ? "4px solid #CD7F32" : "4px solid transparent",
                          cursor: "pointer",
                          transition: "background 0.2s",
                        }}
                      >
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
                          marginRight: "15px",
                          flexShrink: 0,
                        }}>
                          {index + 1}
                        </div>
                        {logoUrl && (
                          <img
                            src={logoUrl}
                            alt={team.team}
                            style={{ width: "40px", height: "40px", objectFit: "contain", marginRight: "15px", flexShrink: 0 }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        )}
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
                          <svg
                            width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="rgba(255,255,255,0.5)" strokeWidth="2"
                            style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", marginLeft: "8px" }}
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </div>
                      </div>

                      {/* Expanded Detail */}
                      {isExpanded && (
                        <div style={{
                          padding: "25px 30px",
                          background: "rgba(0,0,0,0.5)",
                          borderLeft: index === 0 ? "4px solid var(--yellow)" : index === 1 ? "4px solid #C0C0C0" : index === 2 ? "4px solid #CD7F32" : "4px solid transparent",
                        }}>
                          <div style={{ display: "flex", gap: "30px", alignItems: "flex-start" }}>
                            {logoUrl && (
                              <img
                                src={logoUrl}
                                alt={team.team}
                                style={{ width: "80px", height: "80px", objectFit: "contain", flexShrink: 0 }}
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              />
                            )}
                            <div style={{ flex: 1 }}>
                              <h3 style={{
                                fontFamily: "var(--font-anton), Anton, sans-serif",
                                fontSize: "24px",
                                marginBottom: "8px",
                              }}>
                                {team.team}
                              </h3>
                              <div style={{ display: "flex", gap: "20px", marginBottom: "15px", flexWrap: "wrap" }}>
                                <div style={{
                                  padding: "8px 16px",
                                  background: "rgba(255,215,0,0.15)",
                                  border: "1px solid rgba(255,215,0,0.3)",
                                }}>
                                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", display: "block" }}>TOTAL CHAMPIONSHIPS</span>
                                  <span style={{ fontFamily: "var(--font-roboto-mono), monospace", fontSize: "24px", fontWeight: "bold", color: "var(--yellow)" }}>{team.count}</span>
                                </div>
                                <div style={{
                                  padding: "8px 16px",
                                  background: "rgba(255,255,255,0.05)",
                                  border: "1px solid rgba(255,255,255,0.1)",
                                }}>
                                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", display: "block" }}>LAST WON</span>
                                  <span style={{ fontWeight: "bold", fontSize: "18px" }}>{team.lastWon}</span>
                                </div>
                              </div>

                              {champYears.length > 0 && (
                                <div style={{ marginBottom: "15px" }}>
                                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "8px", fontWeight: "bold" }}>
                                    CHAMPIONSHIP SEASONS IN DATABASE
                                  </div>
                                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                    {champYears.map(year => (
                                      <span key={year} style={{
                                        padding: "4px 10px",
                                        background: "rgba(255,215,0,0.1)",
                                        border: "1px solid rgba(255,215,0,0.2)",
                                        fontSize: "13px",
                                        fontFamily: "var(--font-roboto-mono), monospace",
                                      }}>
                                        {year}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {teamPageUrl && (
                                <Link href={teamPageUrl} style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  padding: "10px 20px",
                                  background: "var(--orange)",
                                  color: "var(--white)",
                                  textDecoration: "none",
                                  fontFamily: "var(--font-anton), Anton, sans-serif",
                                  fontSize: "14px",
                                }}>
                                  VIEW TEAM PAGE
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                  </svg>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
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
