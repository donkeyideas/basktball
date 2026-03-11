"use client";

import { useState, useEffect } from "react";
import { Header, Footer } from "@/components";

// ESPN headshot URL helper for college players
const getEspnHeadshot = (espnId: string) =>
  espnId
    ? `https://a.espncdn.com/combiner/i?img=/i/headshots/mens-college-basketball/players/full/${espnId}.png&w=350&h=254`
    : null;

interface Prospect {
  id?: string;
  rank: number;
  name: string;
  position: string;
  school: string;
  height: string;
  weight: number;
  age: number;
  stats: {
    ppg: number;
    rpg: number;
    apg: number;
    fgPct: number;
    threePct: number;
    ftPct: number;
  };
  strengths: string[];
  weaknesses: string[];
  comparison: string;
  projectedPick: string;
  espnId?: string;
}

export default function DraftPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [positionFilter, setPositionFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProspects() {
      try {
        const res = await fetch("/api/draft/prospects?year=2026");
        const data = await res.json();

        if (data.success && data.prospects?.length > 0) {
          const transformedProspects: Prospect[] = data.prospects.map((p: any) => ({
            id: p.id,
            rank: p.rank,
            name: p.name,
            position: p.position,
            school: p.school,
            height: p.height,
            weight: p.weight,
            age: p.age,
            stats: {
              ppg: p.ppg,
              rpg: p.rpg,
              apg: p.apg,
              fgPct: p.fgPct,
              threePct: p.threePct,
              ftPct: p.ftPct || 0,
            },
            strengths: p.strengths || [],
            weaknesses: p.weaknesses || [],
            comparison: p.comparison || "N/A",
            projectedPick: p.projectedPick || "TBD",
            espnId: p.espnId || "",
          }));
          setProspects(transformedProspects);
          setSelectedProspect(transformedProspects[0]);
        }
      } catch (error) {
        console.error("Error fetching prospects:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProspects();
  }, []);

  const filteredProspects = prospects.filter(p => {
    if (positionFilter !== "all" && !p.position.includes(positionFilter)) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

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
            DRAFT ANALYZER
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
            2026 NBA Draft prospect analysis and big board rankings.
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
              <p style={{ color: "rgba(255,255,255,0.6)" }}>Loading draft prospects...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : prospects.length === 0 ? (
            <div className="section" style={{ textAlign: "center", padding: "60px 20px" }}>
              <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "10px" }}>No draft prospects available.</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>Draft data can be managed from the admin panel.</p>
            </div>
          ) : (
          <div style={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: "30px" }}>
            {/* Big Board */}
            <div className="section">
              <div className="section-title">2026 Big Board</div>

              {/* Filters */}
              <div style={{ marginBottom: "20px" }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search prospects..."
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "var(--white)",
                    marginBottom: "10px"
                  }}
                />
                <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                  {["all", "PG", "SG", "SF", "PF", "C"].map(pos => (
                    <button
                      key={pos}
                      onClick={() => setPositionFilter(pos)}
                      style={{
                        padding: "6px 12px",
                        background: positionFilter === pos ? "var(--orange)" : "transparent",
                        border: "1px solid",
                        borderColor: positionFilter === pos ? "var(--orange)" : "rgba(255,255,255,0.2)",
                        color: "var(--white)",
                        cursor: "pointer",
                        fontSize: "12px"
                      }}
                    >
                      {pos === "all" ? "ALL" : pos}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prospect List */}
              <div style={{ maxHeight: "600px", overflowY: "auto" }}>
                {filteredProspects.map(prospect => {
                  const headshotUrl = getEspnHeadshot(prospect.espnId || "");
                  return (
                    <div
                      key={prospect.rank}
                      onClick={() => setSelectedProspect(prospect)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "12px",
                        background: selectedProspect?.rank === prospect.rank ? "rgba(255, 107, 53, 0.2)" : "rgba(0,0,0,0.3)",
                        border: selectedProspect?.rank === prospect.rank ? "1px solid var(--orange)" : "1px solid transparent",
                        marginBottom: "8px",
                        cursor: "pointer"
                      }}
                    >
                      <div style={{
                        width: "40px",
                        height: "40px",
                        background: prospect.rank <= 3 ? "var(--orange)" : "rgba(255,255,255,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        fontFamily: "var(--font-roboto-mono), monospace",
                        marginRight: "12px",
                        flexShrink: 0,
                      }}>
                        {prospect.rank}
                      </div>
                      {/* Headshot in list */}
                      <div style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        overflow: "hidden",
                        marginRight: "12px",
                        flexShrink: 0,
                        background: "rgba(255,255,255,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        {headshotUrl ? (
                          <img
                            src={headshotUrl}
                            alt={prospect.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              if (target.parentElement) {
                                target.parentElement.textContent = prospect.name.split(" ").map(n => n[0]).join("");
                              }
                            }}
                          />
                        ) : (
                          <span style={{ fontSize: "12px", fontWeight: "bold" }}>
                            {prospect.name.split(" ").map(n => n[0]).join("")}
                          </span>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{prospect.name}</div>
                        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                          {prospect.position} | {prospect.school}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Projected</div>
                        <div style={{ fontFamily: "var(--font-roboto-mono), monospace", color: "var(--green)" }}>
                          #{prospect.projectedPick}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Prospect Profile */}
            {selectedProspect && (
            <div>
              <div className="section">
                <div style={{ display: "flex", gap: "30px", marginBottom: "30px" }}>
                  {/* Headshot */}
                  <div style={{
                    width: "150px",
                    height: "150px",
                    background: "rgba(255,255,255,0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "48px",
                    fontWeight: "bold",
                    flexShrink: 0,
                    overflow: "hidden",
                    borderRadius: "8px",
                  }}>
                    {(() => {
                      const url = getEspnHeadshot(selectedProspect.espnId || "");
                      if (url) {
                        return (
                          <img
                            src={url}
                            alt={selectedProspect.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              if (target.parentElement) {
                                target.parentElement.style.background = "var(--orange)";
                                target.parentElement.textContent = selectedProspect.name.split(" ").map(n => n[0]).join("");
                              }
                            }}
                          />
                        );
                      }
                      return (
                        <span style={{ color: "var(--white)" }}>
                          {selectedProspect.name.split(" ").map(n => n[0]).join("")}
                        </span>
                      );
                    })()}
                  </div>

                  {/* Basic Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "10px" }}>
                      <span style={{
                        padding: "4px 12px",
                        background: "var(--orange)",
                        fontWeight: "bold",
                        fontSize: "14px"
                      }}>
                        #{selectedProspect.rank}
                      </span>
                      <h2 style={{ fontFamily: "var(--font-anton), Anton, sans-serif", fontSize: "32px", margin: 0 }}>
                        {selectedProspect.name}
                      </h2>
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.6)", marginBottom: "15px" }}>
                      {selectedProspect.position} | {selectedProspect.school}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "15px" }}>
                      <div>
                        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Height</div>
                        <div style={{ fontFamily: "var(--font-roboto-mono), monospace", fontWeight: "bold" }}>{selectedProspect.height}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Weight</div>
                        <div style={{ fontFamily: "var(--font-roboto-mono), monospace", fontWeight: "bold" }}>{selectedProspect.weight} lbs</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Age</div>
                        <div style={{ fontFamily: "var(--font-roboto-mono), monospace", fontWeight: "bold" }}>{selectedProspect.age}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Projected</div>
                        <div style={{ fontFamily: "var(--font-roboto-mono), monospace", fontWeight: "bold", color: "var(--green)" }}>
                          Pick #{selectedProspect.projectedPick}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="section-title">2025-26 Season Stats</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "15px", marginBottom: "30px" }}>
                  {[
                    { label: "PPG", value: selectedProspect.stats.ppg },
                    { label: "RPG", value: selectedProspect.stats.rpg },
                    { label: "APG", value: selectedProspect.stats.apg },
                    { label: "FG%", value: selectedProspect.stats.fgPct },
                    { label: "3P%", value: selectedProspect.stats.threePct },
                    { label: "FT%", value: selectedProspect.stats.ftPct },
                  ].map(stat => (
                    <div key={stat.label} style={{ background: "rgba(0,0,0,0.3)", padding: "20px", textAlign: "center" }}>
                      <div style={{ fontFamily: "var(--font-roboto-mono), monospace", fontSize: "24px", fontWeight: "bold" }}>
                        {stat.value.toFixed(1)}
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Scouting Report */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div>
                    <div className="section-title">Strengths</div>
                    {selectedProspect.strengths.map((strength, index) => (
                      <div key={index} style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px",
                        background: "rgba(16, 185, 129, 0.1)",
                        marginBottom: "8px"
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>{strength}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="section-title">Areas to Improve</div>
                    {selectedProspect.weaknesses.map((weakness, index) => (
                      <div key={index} style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px",
                        background: "rgba(239, 68, 68, 0.1)",
                        marginBottom: "8px"
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        <span>{weakness}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comparison */}
                <div style={{ marginTop: "30px", padding: "20px", background: "rgba(255, 107, 53, 0.1)", border: "1px solid var(--orange)" }}>
                  <div style={{ color: "var(--orange)", fontWeight: "bold", marginBottom: "10px" }}>Player Comparison</div>
                  <div style={{ fontSize: "24px", fontFamily: "var(--font-anton), Anton, sans-serif" }}>
                    {selectedProspect.comparison}
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
