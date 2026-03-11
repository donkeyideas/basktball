"use client";

import { useState } from "react";
import { Header, Footer } from "@/components";

interface MetricExplanation {
  name: string;
  abbr: string;
  description: string;
  formula: string;
  goodValue: string;
}

const metrics: MetricExplanation[] = [
  {
    name: "Player Efficiency Rating",
    abbr: "PER",
    description: "A measure of per-minute production standardized to a league average of 15.",
    formula: "(Points + Rebounds + Assists + Steals + Blocks - Missed FG - Missed FT - TO) / Minutes",
    goodValue: ">20 is excellent, 15 is average",
  },
  {
    name: "True Shooting Percentage",
    abbr: "TS%",
    description: "A shooting percentage that factors in 2-pointers, 3-pointers, and free throws.",
    formula: "Points / (2 × (FGA + 0.44 × FTA))",
    goodValue: ">60% is excellent, 55% is average",
  },
  {
    name: "Effective Field Goal Percentage",
    abbr: "eFG%",
    description: "Adjusts FG% to account for the extra value of 3-pointers.",
    formula: "(FGM + 0.5 × 3PM) / FGA",
    goodValue: ">55% is excellent, 50% is average",
  },
  {
    name: "Value Over Replacement Player",
    abbr: "VORP",
    description: "Estimates the points per 100 possessions a player contributes above a replacement-level player.",
    formula: "Based on BPM and minutes played over a season",
    goodValue: ">3.0 is All-Star level, >6.0 is MVP level",
  },
  {
    name: "Box Plus/Minus",
    abbr: "BPM",
    description: "A box score estimate of the points per 100 possessions a player contributes above league average.",
    formula: "Complex formula using box score stats and position",
    goodValue: ">5 is excellent, 0 is average",
  },
  {
    name: "Win Shares",
    abbr: "WS",
    description: "An estimate of the number of wins a player contributes to their team.",
    formula: "Offensive WS + Defensive WS",
    goodValue: ">10 per season is All-Star level",
  },
  {
    name: "Usage Rate",
    abbr: "USG%",
    description: "Estimates the percentage of team plays used by a player while on the floor.",
    formula: "100 × ((FGA + 0.44 × FTA + TO) × (Team MP / 5)) / (MP × (Team FGA + 0.44 × Team FTA + Team TO))",
    goodValue: ">30% is high usage star, ~20% is average",
  },
  {
    name: "Assist Percentage",
    abbr: "AST%",
    description: "Estimates the percentage of teammate field goals a player assisted.",
    formula: "100 × AST / (((MP / (Team MP / 5)) × Team FGM) - FGM)",
    goodValue: ">30% is point guard level",
  },
];

export default function MetricsPage() {
  const [selectedMetric, setSelectedMetric] = useState<MetricExplanation | null>(metrics[0]);
  const [calculator, setCalculator] = useState({
    points: 25,
    fga: 20,
    fta: 8,
    ftm: 7,
    threePm: 3,
  });

  const ts = calculator.points / (2 * (calculator.fga + 0.44 * calculator.fta)) * 100;
  const efg = ((calculator.points - calculator.ftm) / 2 + 0.5 * calculator.threePm) / calculator.fga * 100;

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
            ADVANCED METRICS
            <span style={{
              display: "block",
              width: "100px",
              height: "4px",
              background: "var(--orange)",
              margin: "15px auto 0"
            }}></span>
          </h1>

          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "40px", marginTop: "40px" }}>
            {/* Metrics List */}
            <div className="section">
              <div className="section-title">Metrics Guide</div>
              {metrics.map(metric => (
                <div
                  key={metric.abbr}
                  onClick={() => setSelectedMetric(metric)}
                  style={{
                    padding: "15px",
                    marginBottom: "10px",
                    background: selectedMetric?.abbr === metric.abbr ? "rgba(255, 107, 53, 0.2)" : "rgba(0,0,0,0.3)",
                    border: selectedMetric?.abbr === metric.abbr ? "1px solid var(--orange)" : "1px solid transparent",
                    cursor: "pointer",
                    transition: "all 0.3s ease"
                  }}
                >
                  <div style={{ fontWeight: "bold", color: "var(--orange)" }}>{metric.abbr}</div>
                  <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)" }}>{metric.name}</div>
                </div>
              ))}
            </div>

            {/* Detail & Calculator */}
            <div>
              {selectedMetric && (
                <div className="section">
                  <div className="section-title">{selectedMetric.name} ({selectedMetric.abbr})</div>
                  <p style={{ marginBottom: "20px", lineHeight: "1.6" }}>{selectedMetric.description}</p>

                  <div style={{ background: "rgba(0,0,0,0.3)", padding: "20px", marginBottom: "20px" }}>
                    <div style={{ color: "var(--orange)", marginBottom: "10px", fontWeight: "bold" }}>Formula:</div>
                    <code style={{ fontFamily: "var(--font-roboto-mono), monospace", fontSize: "14px" }}>
                      {selectedMetric.formula}
                    </code>
                  </div>

                  <div style={{ background: "rgba(16, 185, 129, 0.1)", padding: "20px", border: "1px solid var(--green)" }}>
                    <div style={{ color: "var(--green)", marginBottom: "10px", fontWeight: "bold" }}>What&apos;s Good?</div>
                    <span>{selectedMetric.goodValue}</span>
                  </div>
                </div>
              )}

              <div className="section">
                <div className="section-title">Quick Calculator</div>
                <p style={{ marginBottom: "20px", color: "rgba(255,255,255,0.6)" }}>
                  Enter stats to calculate TS% and eFG%
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "15px", marginBottom: "30px" }}>
                  {[
                    { key: "points", label: "PTS" },
                    { key: "fga", label: "FGA" },
                    { key: "fta", label: "FTA" },
                    { key: "ftm", label: "FTM" },
                    { key: "threePm", label: "3PM" },
                  ].map(input => (
                    <div key={input.key}>
                      <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                        {input.label}
                      </label>
                      <input
                        type="number"
                        value={calculator[input.key as keyof typeof calculator]}
                        onChange={(e) => setCalculator({ ...calculator, [input.key]: parseFloat(e.target.value) || 0 })}
                        style={{
                          width: "100%",
                          padding: "12px",
                          background: "rgba(0,0,0,0.3)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: "var(--white)",
                          fontFamily: "var(--font-roboto-mono), monospace",
                          textAlign: "center"
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div style={{ background: "rgba(0,0,0,0.3)", padding: "25px", textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--font-roboto-mono), monospace", fontSize: "36px", fontWeight: "bold", color: ts > 60 ? "var(--green)" : ts > 55 ? "var(--yellow)" : "var(--red)" }}>
                      {isNaN(ts) ? "0.0" : ts.toFixed(1)}%
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.5)", marginTop: "5px" }}>True Shooting %</div>
                  </div>
                  <div style={{ background: "rgba(0,0,0,0.3)", padding: "25px", textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--font-roboto-mono), monospace", fontSize: "36px", fontWeight: "bold", color: efg > 55 ? "var(--green)" : efg > 50 ? "var(--yellow)" : "var(--red)" }}>
                      {isNaN(efg) ? "0.0" : efg.toFixed(1)}%
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.5)", marginTop: "5px" }}>Effective FG %</div>
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
