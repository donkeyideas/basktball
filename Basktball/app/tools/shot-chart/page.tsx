"use client";

import { useState } from "react";
import { Header, Footer } from "@/components";

interface Shot {
  x: number;
  y: number;
  made: boolean;
  type: string;
}

// Sample shot data for demonstration (basket at top, y=0 is baseline)
const sampleShots: Shot[] = [
  // 3PT shots (beyond the arc)
  { x: 250, y: 380, made: true, type: "3PT" },
  { x: 120, y: 320, made: false, type: "3PT" },
  { x: 380, y: 320, made: true, type: "3PT" },
  { x: 50, y: 180, made: true, type: "3PT" },
  { x: 450, y: 180, made: false, type: "3PT" },
  // Mid-range shots
  { x: 150, y: 200, made: true, type: "Mid" },
  { x: 350, y: 200, made: false, type: "Mid" },
  { x: 200, y: 280, made: true, type: "Mid" },
  { x: 300, y: 280, made: true, type: "Mid" },
  // Paint shots
  { x: 220, y: 150, made: true, type: "Paint" },
  { x: 280, y: 150, made: false, type: "Paint" },
  { x: 250, y: 180, made: true, type: "Paint" },
  { x: 230, y: 120, made: true, type: "Paint" },
  // Rim shots (close to basket)
  { x: 250, y: 70, made: true, type: "Rim" },
  { x: 235, y: 85, made: true, type: "Rim" },
  { x: 265, y: 85, made: false, type: "Rim" },
  { x: 250, y: 95, made: true, type: "Rim" },
];

export default function ShotChartPage() {
  const [shots] = useState<Shot[]>(sampleShots);
  const [filter, setFilter] = useState<"all" | "made" | "missed">("all");
  const [zoneFilter, setZoneFilter] = useState<string>("all");

  const filteredShots = shots.filter(shot => {
    if (filter === "made" && !shot.made) return false;
    if (filter === "missed" && shot.made) return false;
    if (zoneFilter !== "all" && shot.type !== zoneFilter) return false;
    return true;
  });

  const stats = {
    total: shots.length,
    made: shots.filter(s => s.made).length,
    missed: shots.filter(s => !s.made).length,
    percentage: ((shots.filter(s => s.made).length / shots.length) * 100).toFixed(1),
    threePoint: {
      made: shots.filter(s => s.type === "3PT" && s.made).length,
      total: shots.filter(s => s.type === "3PT").length,
    },
    midRange: {
      made: shots.filter(s => s.type === "Mid" && s.made).length,
      total: shots.filter(s => s.type === "Mid").length,
    },
    paint: {
      made: shots.filter(s => s.type === "Paint" && s.made).length,
      total: shots.filter(s => s.type === "Paint").length,
    },
    rim: {
      made: shots.filter(s => s.type === "Rim" && s.made).length,
      total: shots.filter(s => s.type === "Rim").length,
    },
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
            SHOT CHART ANALYZER
            <span style={{
              display: "block",
              width: "100px",
              height: "4px",
              background: "var(--orange)",
              margin: "15px auto 0"
            }}></span>
          </h1>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "40px", marginTop: "40px" }}>
            {/* Court */}
            <div className="section">
              <div className="section-title">Shot Distribution</div>
              <div style={{ position: "relative", width: "500px", height: "470px", margin: "0 auto", background: "rgba(200, 159, 108, 0.1)", border: "3px solid var(--court-wood)" }}>
                {/* Court markings - basket at top */}
                <svg width="500" height="470" style={{ position: "absolute", top: 0, left: 0 }}>
                  {/* Backboard */}
                  <rect x="220" y="35" width="60" height="5" fill="var(--court-wood)" />
                  {/* Basket/Rim */}
                  <circle cx="250" cy="55" r="15" fill="none" stroke="var(--orange)" strokeWidth="3" />
                  {/* Restricted area arc */}
                  <path d="M 210 55 A 40 40 0 0 0 290 55" fill="none" stroke="var(--court-wood)" strokeWidth="2" />
                  {/* Paint/Key rectangle */}
                  <rect x="170" y="0" width="160" height="190" fill="none" stroke="var(--court-wood)" strokeWidth="2" />
                  {/* Free throw circle */}
                  <circle cx="250" cy="190" r="60" fill="none" stroke="var(--court-wood)" strokeWidth="2" />
                  {/* Three point line - corners straight, arc in middle */}
                  <path
                    d="M 30 0 L 30 140 A 220 220 0 0 0 470 140 L 470 0"
                    fill="none"
                    stroke="var(--court-wood)"
                    strokeWidth="2"
                  />
                </svg>

                {/* Shots */}
                {filteredShots.map((shot, index) => (
                  <div
                    key={index}
                    style={{
                      position: "absolute",
                      left: shot.x - 8,
                      top: shot.y - 8,
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      background: shot.made ? "var(--green)" : "var(--red)",
                      border: "2px solid var(--white)",
                      opacity: 0.8,
                      transition: "all 0.3s ease"
                    }}
                    title={`${shot.type} - ${shot.made ? "Made" : "Missed"}`}
                  />
                ))}
              </div>

              {/* Filters */}
              <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "20px" }}>
                {["all", "made", "missed"].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f as typeof filter)}
                    style={{
                      padding: "8px 20px",
                      background: filter === f ? "var(--orange)" : "transparent",
                      border: "1px solid",
                      borderColor: filter === f ? "var(--orange)" : "rgba(255,255,255,0.2)",
                      color: "var(--white)",
                      cursor: "pointer",
                      textTransform: "capitalize"
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div>
              <div className="section">
                <div className="section-title">Shot Statistics</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                  <div style={{ background: "rgba(0,0,0,0.3)", padding: "20px", textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--font-roboto-mono), monospace", fontSize: "32px", fontWeight: "bold" }}>
                      {stats.percentage}%
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>FG%</div>
                  </div>
                  <div style={{ background: "rgba(0,0,0,0.3)", padding: "20px", textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--font-roboto-mono), monospace", fontSize: "32px", fontWeight: "bold" }}>
                      {stats.made}/{stats.total}
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>FGM/FGA</div>
                  </div>
                </div>
              </div>

              <div className="section">
                <div className="section-title">By Zone</div>
                {[
                  { name: "3PT", key: "threePoint" as const },
                  { name: "Mid-Range", key: "midRange" as const },
                  { name: "Paint", key: "paint" as const },
                  { name: "Rim", key: "rim" as const },
                ].map(zone => {
                  const zoneStats = stats[zone.key];
                  const pct = zoneStats.total > 0 ? ((zoneStats.made / zoneStats.total) * 100).toFixed(1) : "0.0";
                  return (
                    <div
                      key={zone.key}
                      onClick={() => setZoneFilter(zoneFilter === zone.name.replace("-Range", "") ? "all" : zone.name.replace("-Range", ""))}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "15px",
                        background: zoneFilter === zone.name.replace("-Range", "") ? "rgba(255, 107, 53, 0.2)" : "rgba(0,0,0,0.3)",
                        marginBottom: "10px",
                        cursor: "pointer",
                        border: zoneFilter === zone.name.replace("-Range", "") ? "1px solid var(--orange)" : "1px solid transparent"
                      }}
                    >
                      <span>{zone.name}</span>
                      <span style={{ fontFamily: "var(--font-roboto-mono), monospace" }}>
                        {zoneStats.made}/{zoneStats.total} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="section">
                <div className="section-title">Legend</div>
                <div style={{ display: "flex", gap: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "var(--green)" }} />
                    <span>Made</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "var(--red)" }} />
                    <span>Missed</span>
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
