"use client";

import { useState, useEffect } from "react";
import { Header, Footer } from "@/components";

interface BettingLine {
  id: string;
  homeTeam: string;
  awayTeam: string;
  spread: number;
  spreadOdds: { home: number; away: number };
  total: number;
  totalOdds: { over: number; under: number };
  moneyline: { home: number; away: number };
  gameTime: string;
  modelPrediction: {
    homeWinProb: number;
    predictedSpread: number;
    predictedTotal: number;
    spreadEdge: number;
    totalEdge: number;
  };
}

interface PropBet {
  id: string;
  player: string;
  team?: string;
  stat: string;
  line: number;
  odds: { over: number; under: number };
  projection: number;
  edge: number;
}

function formatOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : `${odds}`;
}

export default function BettingPage() {
  const [lines, setLines] = useState<BettingLine[]>([]);
  const [props, setProps] = useState<PropBet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"games" | "props">("games");
  const [showEdgeOnly, setShowEdgeOnly] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [linesRes, propsRes] = await Promise.all([
          fetch("/api/betting/lines"),
          fetch("/api/betting/props"),
        ]);
        const linesData = await linesRes.json();
        const propsData = await propsRes.json();

        if (linesData.success) setLines(linesData.lines || []);
        if (propsData.success) setProps(propsData.props || []);
      } catch (error) {
        console.error("Error fetching betting data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredProps = showEdgeOnly ? props.filter(p => p.edge > 1) : props;

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
            BETTING INSIGHTS
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
            Data-driven insights for spreads, totals, and props with model projections.
          </p>

          {/* Disclaimer */}
          <div style={{
            background: "rgba(245, 158, 11, 0.1)",
            border: "1px solid var(--yellow)",
            padding: "15px",
            marginBottom: "30px",
            textAlign: "center"
          }}>
            <span style={{ color: "var(--yellow)", fontWeight: "bold" }}>DISCLAIMER:</span>
            <span style={{ color: "rgba(255,255,255,0.7)", marginLeft: "10px" }}>
              For entertainment purposes only. Please gamble responsibly.
            </span>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "30px" }}>
            <button
              onClick={() => setActiveTab("games")}
              style={{
                padding: "12px 30px",
                background: activeTab === "games" ? "var(--orange)" : "transparent",
                border: "1px solid",
                borderColor: activeTab === "games" ? "var(--orange)" : "rgba(255,255,255,0.2)",
                color: "var(--white)",
                cursor: "pointer",
                fontFamily: "var(--font-anton), Anton, sans-serif",
                fontSize: "16px"
              }}
            >
              GAME LINES
            </button>
            <button
              onClick={() => setActiveTab("props")}
              style={{
                padding: "12px 30px",
                background: activeTab === "props" ? "var(--orange)" : "transparent",
                border: "1px solid",
                borderColor: activeTab === "props" ? "var(--orange)" : "rgba(255,255,255,0.2)",
                color: "var(--white)",
                cursor: "pointer",
                fontFamily: "var(--font-anton), Anton, sans-serif",
                fontSize: "16px"
              }}
            >
              PLAYER PROPS
            </button>
          </div>

          {activeTab === "games" && (
            <div style={{ display: "grid", gap: "20px" }}>
              {lines.map(line => (
                <div key={line.id} className="section">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 200px 200px 200px 1fr", gap: "20px", alignItems: "center" }}>
                    {/* Teams */}
                    <div>
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "5px" }}>{line.gameTime}</div>
                      <div style={{ marginBottom: "10px" }}>
                        <span style={{ fontWeight: "bold" }}>{line.awayTeam}</span>
                        <span style={{ color: "rgba(255,255,255,0.5)", marginLeft: "10px" }}>@</span>
                      </div>
                      <div>
                        <span style={{ fontWeight: "bold" }}>{line.homeTeam}</span>
                      </div>
                    </div>

                    {/* Spread */}
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "10px" }}>SPREAD</div>
                      <div style={{ marginBottom: "8px" }}>
                        <span style={{ fontFamily: "var(--font-roboto-mono), monospace" }}>
                          {line.spread > 0 ? "+" : ""}{(-line.spread).toFixed(1)}
                        </span>
                        <span style={{ color: "rgba(255,255,255,0.5)", marginLeft: "8px", fontSize: "14px" }}>
                          ({formatOdds(line.spreadOdds.away)})
                        </span>
                      </div>
                      <div>
                        <span style={{ fontFamily: "var(--font-roboto-mono), monospace" }}>
                          {line.spread.toFixed(1)}
                        </span>
                        <span style={{ color: "rgba(255,255,255,0.5)", marginLeft: "8px", fontSize: "14px" }}>
                          ({formatOdds(line.spreadOdds.home)})
                        </span>
                      </div>
                    </div>

                    {/* Total */}
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "10px" }}>TOTAL</div>
                      <div style={{ marginBottom: "8px" }}>
                        <span style={{ fontFamily: "var(--font-roboto-mono), monospace" }}>O {line.total}</span>
                        <span style={{ color: "rgba(255,255,255,0.5)", marginLeft: "8px", fontSize: "14px" }}>
                          ({formatOdds(line.totalOdds.over)})
                        </span>
                      </div>
                      <div>
                        <span style={{ fontFamily: "var(--font-roboto-mono), monospace" }}>U {line.total}</span>
                        <span style={{ color: "rgba(255,255,255,0.5)", marginLeft: "8px", fontSize: "14px" }}>
                          ({formatOdds(line.totalOdds.under)})
                        </span>
                      </div>
                    </div>

                    {/* Moneyline */}
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "10px" }}>MONEYLINE</div>
                      <div style={{ marginBottom: "8px" }}>
                        <span style={{ fontFamily: "var(--font-roboto-mono), monospace" }}>
                          {formatOdds(line.moneyline.away)}
                        </span>
                      </div>
                      <div>
                        <span style={{ fontFamily: "var(--font-roboto-mono), monospace" }}>
                          {formatOdds(line.moneyline.home)}
                        </span>
                      </div>
                    </div>

                    {/* Model Prediction */}
                    <div style={{ background: "rgba(0,0,0,0.3)", padding: "15px" }}>
                      <div style={{ fontSize: "12px", color: "var(--orange)", marginBottom: "10px", fontWeight: "bold" }}>MODEL PREDICTION</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "13px" }}>
                        <div>Win Prob:</div>
                        <div style={{ fontFamily: "var(--font-roboto-mono), monospace", textAlign: "right" }}>
                          {line.modelPrediction.homeWinProb}%
                        </div>
                        <div>Pred Spread:</div>
                        <div style={{ fontFamily: "var(--font-roboto-mono), monospace", textAlign: "right" }}>
                          {line.modelPrediction.predictedSpread.toFixed(1)}
                        </div>
                        <div>Spread Edge:</div>
                        <div style={{
                          fontFamily: "var(--font-roboto-mono), monospace",
                          textAlign: "right",
                          color: line.modelPrediction.spreadEdge > 0 ? "var(--green)" : line.modelPrediction.spreadEdge < -1 ? "var(--red)" : "inherit"
                        }}>
                          {line.modelPrediction.spreadEdge > 0 ? "+" : ""}{line.modelPrediction.spreadEdge.toFixed(1)}
                        </div>
                        <div>Total Edge:</div>
                        <div style={{
                          fontFamily: "var(--font-roboto-mono), monospace",
                          textAlign: "right",
                          color: Math.abs(line.modelPrediction.totalEdge) > 2 ? "var(--green)" : "inherit"
                        }}>
                          {line.modelPrediction.totalEdge > 0 ? "+" : ""}{line.modelPrediction.totalEdge.toFixed(1)} ({line.modelPrediction.totalEdge > 0 ? "OVER" : "UNDER"})
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "props" && (
            <div className="section">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div className="section-title" style={{ marginBottom: 0 }}>Player Props</div>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={showEdgeOnly}
                    onChange={(e) => setShowEdgeOnly(e.target.checked)}
                  />
                  <span style={{ fontSize: "14px" }}>Show edge {">"} 1 only</span>
                </label>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--orange)" }}>
                    <th style={{ padding: "12px", textAlign: "left" }}>Player</th>
                    <th style={{ padding: "12px", textAlign: "left" }}>Stat</th>
                    <th style={{ padding: "12px", textAlign: "center" }}>Line</th>
                    <th style={{ padding: "12px", textAlign: "center" }}>Over</th>
                    <th style={{ padding: "12px", textAlign: "center" }}>Under</th>
                    <th style={{ padding: "12px", textAlign: "center" }}>Projection</th>
                    <th style={{ padding: "12px", textAlign: "center" }}>Edge</th>
                    <th style={{ padding: "12px", textAlign: "center" }}>Lean</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProps.map((prop, index) => (
                    <tr key={index} style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                      <td style={{ padding: "12px", fontWeight: "bold" }}>{prop.player}</td>
                      <td style={{ padding: "12px" }}>{prop.stat}</td>
                      <td style={{ padding: "12px", textAlign: "center", fontFamily: "var(--font-roboto-mono), monospace" }}>
                        {prop.line}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center", fontFamily: "var(--font-roboto-mono), monospace" }}>
                        {formatOdds(prop.odds.over)}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center", fontFamily: "var(--font-roboto-mono), monospace" }}>
                        {formatOdds(prop.odds.under)}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center", fontFamily: "var(--font-roboto-mono), monospace" }}>
                        {prop.projection.toFixed(1)}
                      </td>
                      <td style={{
                        padding: "12px",
                        textAlign: "center",
                        fontFamily: "var(--font-roboto-mono), monospace",
                        color: prop.edge > 2 ? "var(--green)" : prop.edge > 1 ? "var(--yellow)" : "inherit"
                      }}>
                        {prop.edge > 0 ? "+" : ""}{prop.edge.toFixed(1)}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <span style={{
                          padding: "4px 12px",
                          background: prop.projection > prop.line ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
                          color: prop.projection > prop.line ? "var(--green)" : "var(--red)",
                          fontWeight: "bold",
                          fontSize: "12px"
                        }}>
                          {prop.projection > prop.line ? "OVER" : "UNDER"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
