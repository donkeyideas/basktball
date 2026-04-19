"use client";

import { useState, useEffect } from "react";
import { Header, Footer } from "@/components";

interface GameProjection {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  gameTime: string;
  modelPrediction: {
    homeWinProb: number;
    predictedSpread: number;
    predictedTotal: number;
  };
}

interface PlayerProjection {
  id: string;
  player: string;
  team?: string;
  stat: string;
  projection: number;
}

export default function BettingPage() {
  const [games, setGames] = useState<GameProjection[]>([]);
  const [playerProjections, setPlayerProjections] = useState<PlayerProjection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"games" | "props">("games");

  useEffect(() => {
    async function fetchData() {
      try {
        const [linesRes, propsRes] = await Promise.all([
          fetch("/api/betting/lines"),
          fetch("/api/betting/props"),
        ]);
        const linesData = await linesRes.json();
        const propsData = await propsRes.json();

        if (linesData.success) {
          setGames((linesData.lines || []).map((l: Record<string, unknown>) => ({
            id: l.id,
            homeTeam: l.homeTeam,
            awayTeam: l.awayTeam,
            homeTeamLogo: l.homeTeamLogo,
            awayTeamLogo: l.awayTeamLogo,
            gameTime: l.gameTime,
            modelPrediction: (l as Record<string, unknown>).modelPrediction,
          })));
        }
        if (propsData.success) {
          setPlayerProjections((propsData.props || []).map((p: Record<string, unknown>) => ({
            id: p.id,
            player: p.player,
            team: p.team,
            stat: p.stat,
            projection: p.projection,
          })));
        }
      } catch (error) {
        console.error("Error fetching projection data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

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
            MODEL PROJECTIONS
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
            color: "var(--text-muted)",
            marginBottom: "40px"
          }}>
            Statistical model projections based on team and player performance data.
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
            <span style={{ color: "var(--text-secondary)", marginLeft: "10px" }}>
              These are NOT real sportsbook lines or odds. All numbers are statistical model projections for entertainment purposes only.
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
                borderColor: activeTab === "games" ? "var(--orange)" : "var(--text-faint)",
                color: "var(--white)",
                cursor: "pointer",
                fontFamily: "var(--font-anton), Anton, sans-serif",
                fontSize: "16px"
              }}
            >
              GAME PROJECTIONS
            </button>
            <button
              onClick={() => setActiveTab("props")}
              style={{
                padding: "12px 30px",
                background: activeTab === "props" ? "var(--orange)" : "transparent",
                border: "1px solid",
                borderColor: activeTab === "props" ? "var(--orange)" : "var(--text-faint)",
                color: "var(--white)",
                cursor: "pointer",
                fontFamily: "var(--font-anton), Anton, sans-serif",
                fontSize: "16px"
              }}
            >
              PLAYER PROJECTIONS
            </button>
          </div>

          {isLoading ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{
                width: "40px",
                height: "40px",
                border: "3px solid var(--border-color)",
                borderTopColor: "var(--orange)",
                borderRadius: "50%",
                margin: "0 auto 20px",
                animation: "spin 1s linear infinite"
              }} />
              <p style={{ color: "var(--text-muted)" }}>Loading projections...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : activeTab === "games" ? (
            <div style={{ display: "grid", gap: "15px" }}>
              {games.length === 0 ? (
                <div className="section" style={{ textAlign: "center", padding: "60px 20px" }}>
                  <p style={{ color: "var(--text-muted)" }}>No games scheduled today.</p>
                </div>
              ) : games.map(game => (
                <div key={game.id} className="section" style={{ padding: "20px" }}>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "15px" }}>{game.gameTime}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "20px", alignItems: "center" }}>
                    {/* Away Team */}
                    <div style={{ textAlign: "center" }}>
                      {game.awayTeamLogo && (
                        <img
                          src={game.awayTeamLogo}
                          alt={game.awayTeam}
                          style={{ width: "40px", height: "40px", objectFit: "contain", marginBottom: "8px" }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      )}
                      <div style={{ fontWeight: "bold" }}>{game.awayTeam}</div>
                      <div style={{
                        fontFamily: "var(--font-roboto-mono), monospace",
                        fontSize: "24px",
                        fontWeight: "bold",
                        color: game.modelPrediction.homeWinProb < 50 ? "var(--green)" : "inherit",
                        marginTop: "5px"
                      }}>
                        {(100 - game.modelPrediction.homeWinProb).toFixed(0)}%
                      </div>
                    </div>

                    {/* Middle Stats */}
                    <div style={{ textAlign: "center", minWidth: "140px" }}>
                      <div style={{ fontFamily: "var(--font-anton), Anton, sans-serif", fontSize: "20px", color: "var(--text-faint)", marginBottom: "15px" }}>VS</div>
                      <div style={{ background: "rgba(0,0,0,0.3)", padding: "12px", display: "grid", gap: "8px" }}>
                        <div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>PROJ. SPREAD</div>
                          <div style={{ fontFamily: "var(--font-roboto-mono), monospace", fontSize: "18px", fontWeight: "bold" }}>
                            {game.modelPrediction.predictedSpread > 0 ? "+" : ""}{game.modelPrediction.predictedSpread.toFixed(1)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>PROJ. TOTAL</div>
                          <div style={{ fontFamily: "var(--font-roboto-mono), monospace", fontSize: "18px", fontWeight: "bold" }}>
                            {game.modelPrediction.predictedTotal.toFixed(0)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Home Team */}
                    <div style={{ textAlign: "center" }}>
                      {game.homeTeamLogo && (
                        <img
                          src={game.homeTeamLogo}
                          alt={game.homeTeam}
                          style={{ width: "40px", height: "40px", objectFit: "contain", marginBottom: "8px" }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      )}
                      <div style={{ fontWeight: "bold" }}>{game.homeTeam}</div>
                      <div style={{
                        fontFamily: "var(--font-roboto-mono), monospace",
                        fontSize: "24px",
                        fontWeight: "bold",
                        color: game.modelPrediction.homeWinProb > 50 ? "var(--green)" : "inherit",
                        marginTop: "5px"
                      }}>
                        {game.modelPrediction.homeWinProb.toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="section">
              <div className="section-title" style={{ marginBottom: "20px" }}>Season Averages</div>
              {playerProjections.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px 0" }}>
                  No player projection data available.
                </p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--orange)" }}>
                      <th style={{ padding: "12px", textAlign: "left" }}>Player</th>
                      <th style={{ padding: "12px", textAlign: "left" }}>Team</th>
                      <th style={{ padding: "12px", textAlign: "center" }}>Stat</th>
                      <th style={{ padding: "12px", textAlign: "center" }}>Season Avg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playerProjections.map((p, index) => (
                      <tr key={index} style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <td style={{ padding: "12px", fontWeight: "bold" }}>{p.player}</td>
                        <td style={{ padding: "12px", color: "var(--text-muted)" }}>{p.team || "—"}</td>
                        <td style={{ padding: "12px", textAlign: "center" }}>{p.stat}</td>
                        <td style={{ padding: "12px", textAlign: "center", fontFamily: "var(--font-roboto-mono), monospace", fontWeight: "bold" }}>
                          {p.projection.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Bottom Disclaimer */}
          <p style={{
            textAlign: "center",
            color: "var(--text-faint)",
            fontSize: "12px",
            marginTop: "30px",
            fontStyle: "italic"
          }}>
            All projections are generated by statistical models using team and player performance data. These are not real betting lines or sportsbook odds.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
