"use client";

import { useState } from "react";
import { Header, Footer } from "@/components";

interface Prospect {
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
  };
  strengths: string[];
  weaknesses: string[];
  comparison: string;
  projectedPick: string;
}

// Sample prospect data
const sampleProspects: Prospect[] = [
  {
    rank: 1,
    name: "Cooper Flagg",
    position: "SF/PF",
    school: "Duke",
    height: "6'9\"",
    weight: 205,
    age: 18,
    stats: { ppg: 18.5, rpg: 8.2, apg: 3.8, fgPct: 47.2, threePct: 35.5 },
    strengths: ["Two-way impact", "Versatility", "Basketball IQ", "Motor"],
    weaknesses: ["Three-point consistency", "Needs to add strength"],
    comparison: "Jayson Tatum",
    projectedPick: "1-2"
  },
  {
    rank: 2,
    name: "Ace Bailey",
    position: "SF",
    school: "Rutgers",
    height: "6'9\"",
    weight: 195,
    age: 19,
    stats: { ppg: 17.8, rpg: 7.5, apg: 2.2, fgPct: 45.8, threePct: 38.2 },
    strengths: ["Scoring versatility", "Length", "Shot creation"],
    weaknesses: ["Playmaking", "Defensive consistency"],
    comparison: "Brandon Ingram",
    projectedPick: "1-3"
  },
  {
    rank: 3,
    name: "Dylan Harper",
    position: "PG/SG",
    school: "Rutgers",
    height: "6'6\"",
    weight: 210,
    age: 19,
    stats: { ppg: 21.2, rpg: 5.8, apg: 5.5, fgPct: 48.5, threePct: 33.8 },
    strengths: ["Shot creation", "Physicality", "Playmaking", "Finishing"],
    weaknesses: ["Three-point shooting", "Defensive effort"],
    comparison: "James Harden",
    projectedPick: "3-5"
  },
  {
    rank: 4,
    name: "VJ Edgecombe",
    position: "SG",
    school: "Baylor",
    height: "6'4\"",
    weight: 185,
    age: 19,
    stats: { ppg: 16.5, rpg: 4.2, apg: 3.2, fgPct: 44.5, threePct: 36.8 },
    strengths: ["Athleticism", "Transition", "Perimeter defense"],
    weaknesses: ["Shot selection", "Playmaking in half-court"],
    comparison: "Anthony Edwards",
    projectedPick: "4-8"
  },
  {
    rank: 5,
    name: "Kon Knueppel",
    position: "SG/SF",
    school: "Duke",
    height: "6'6\"",
    weight: 210,
    age: 20,
    stats: { ppg: 14.8, rpg: 5.2, apg: 2.8, fgPct: 46.2, threePct: 42.5 },
    strengths: ["Shooting", "Basketball IQ", "Size for position"],
    weaknesses: ["Lateral quickness", "Creating own shot"],
    comparison: "Klay Thompson",
    projectedPick: "5-10"
  },
  {
    rank: 6,
    name: "Egor Demin",
    position: "PG",
    school: "BYU",
    height: "6'8\"",
    weight: 185,
    age: 18,
    stats: { ppg: 12.5, rpg: 4.8, apg: 6.2, fgPct: 43.5, threePct: 34.2 },
    strengths: ["Size", "Passing vision", "Ball handling for size"],
    weaknesses: ["Finishing at rim", "Defensive intensity"],
    comparison: "Luka Doncic (lite)",
    projectedPick: "6-12"
  },
];

export default function DraftPage() {
  const [prospects] = useState<Prospect[]>(sampleProspects);
  const [selectedProspect, setSelectedProspect] = useState<Prospect>(sampleProspects[0]);
  const [positionFilter, setPositionFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

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
            2025 NBA Draft prospect analysis and big board rankings.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: "30px" }}>
            {/* Big Board */}
            <div className="section">
              <div className="section-title">2025 Big Board</div>

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
              <div style={{ maxHeight: "500px", overflowY: "auto" }}>
                {filteredProspects.map(prospect => (
                  <div
                    key={prospect.rank}
                    onClick={() => setSelectedProspect(prospect)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "12px",
                      background: selectedProspect.rank === prospect.rank ? "rgba(255, 107, 53, 0.2)" : "rgba(0,0,0,0.3)",
                      border: selectedProspect.rank === prospect.rank ? "1px solid var(--orange)" : "1px solid transparent",
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
                      marginRight: "15px"
                    }}>
                      {prospect.rank}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "bold" }}>{prospect.name}</div>
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                        {prospect.position} | {prospect.school}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Projected</div>
                      <div style={{ fontFamily: "var(--font-roboto-mono), monospace", color: "var(--green)" }}>
                        #{prospect.projectedPick}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Prospect Profile */}
            <div>
              <div className="section">
                <div style={{ display: "flex", gap: "30px", marginBottom: "30px" }}>
                  {/* Avatar */}
                  <div style={{
                    width: "150px",
                    height: "150px",
                    background: "var(--orange)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "48px",
                    fontWeight: "bold",
                    flexShrink: 0
                  }}>
                    {selectedProspect.name.split(" ").map(n => n[0]).join("")}
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
                <div className="section-title">Season Stats</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "15px", marginBottom: "30px" }}>
                  {[
                    { label: "PPG", value: selectedProspect.stats.ppg },
                    { label: "RPG", value: selectedProspect.stats.rpg },
                    { label: "APG", value: selectedProspect.stats.apg },
                    { label: "FG%", value: selectedProspect.stats.fgPct },
                    { label: "3P%", value: selectedProspect.stats.threePct },
                  ].map(stat => (
                    <div key={stat.label} style={{ background: "rgba(0,0,0,0.3)", padding: "20px", textAlign: "center" }}>
                      <div style={{ fontFamily: "var(--font-roboto-mono), monospace", fontSize: "28px", fontWeight: "bold" }}>
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
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
