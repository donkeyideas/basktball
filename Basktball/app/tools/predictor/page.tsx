"use client";

import { useState, useEffect, useCallback } from "react";
import { Header, Footer } from "@/components";

interface Team {
  id: string;
  name: string;
  abbreviation: string;
}

interface Prediction {
  homeWinProb: number;
  awayWinProb: number;
  predictedHomeScore: number;
  predictedAwayScore: number;
  spread: number;
  total: number;
  confidence: number;
  factors: { name: string; impact: number; description: string }[];
}

export default function PredictorPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [homeTeam, setHomeTeam] = useState<Team | null>(null);
  const [awayTeam, setAwayTeam] = useState<Team | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    try {
      const res = await fetch("/api/teams?league=nba");
      const data = await res.json();
      if (data.success && data.teams?.length > 0) {
        setTeams(data.teams);
      }
    } catch (err) {
      console.error("Error fetching teams:", err);
    } finally {
      setTeamsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handlePredict = async () => {
    if (!homeTeam || !awayTeam) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
        }),
      });
      const data = await res.json();

      if (data.success && data.prediction) {
        setPrediction(data.prediction);
      } else {
        setError(data.error || "Failed to generate prediction");
      }
    } catch (err) {
      console.error("Error generating prediction:", err);
      setError("Failed to generate prediction. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
            GAME PREDICTOR
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
            AI-powered game predictions using historical data and current form analysis.
          </p>

          {/* Team Selection */}
          {teamsLoading ? (
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
              <p style={{ color: "rgba(255,255,255,0.6)" }}>Loading teams...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : teams.length === 0 ? (
            <div className="section" style={{ textAlign: "center", padding: "60px 20px" }}>
              <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "10px" }}>No teams available.</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>Check back later for updated team data.</p>
            </div>
          ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 1fr", gap: "20px", marginBottom: "40px" }}>
            <div className="section">
              <div className="section-title">Home Team</div>
              <select
                value={homeTeam?.id || ""}
                onChange={(e) => {
                  const team = teams.find(t => t.id === e.target.value);
                  setHomeTeam(team || null);
                  setPrediction(null);
                }}
                style={{
                  width: "100%",
                  padding: "15px",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "var(--white)",
                  fontSize: "16px"
                }}
              >
                <option value="">Select home team...</option>
                {teams.filter(t => t.id !== awayTeam?.id).map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
              {homeTeam && (
                <div style={{ marginTop: "20px", textAlign: "center" }}>
                  <div style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    background: "var(--orange)",
                    margin: "0 auto 15px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    fontWeight: "bold"
                  }}>
                    {homeTeam.abbreviation}
                  </div>
                  <h3 style={{ fontFamily: "var(--font-anton), Anton, sans-serif", fontSize: "20px" }}>{homeTeam.name}</h3>
                </div>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{
                fontFamily: "var(--font-anton), Anton, sans-serif",
                fontSize: "36px",
                color: "rgba(255,255,255,0.3)"
              }}>VS</span>
            </div>

            <div className="section">
              <div className="section-title">Away Team</div>
              <select
                value={awayTeam?.id || ""}
                onChange={(e) => {
                  const team = teams.find(t => t.id === e.target.value);
                  setAwayTeam(team || null);
                  setPrediction(null);
                }}
                style={{
                  width: "100%",
                  padding: "15px",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "var(--white)",
                  fontSize: "16px"
                }}
              >
                <option value="">Select away team...</option>
                {teams.filter(t => t.id !== homeTeam?.id).map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
              {awayTeam && (
                <div style={{ marginTop: "20px", textAlign: "center" }}>
                  <div style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    background: "var(--blue)",
                    margin: "0 auto 15px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    fontWeight: "bold"
                  }}>
                    {awayTeam.abbreviation}
                  </div>
                  <h3 style={{ fontFamily: "var(--font-anton), Anton, sans-serif", fontSize: "20px" }}>{awayTeam.name}</h3>
                </div>
              )}
            </div>
          </div>
          )}

          {/* Predict Button */}
          {teams.length > 0 && (
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <button
              onClick={handlePredict}
              disabled={!homeTeam || !awayTeam || isLoading}
              className="btn"
              style={{
                padding: "15px 50px",
                fontSize: "18px",
                opacity: (!homeTeam || !awayTeam) ? 0.5 : 1
              }}
            >
              {isLoading ? "ANALYZING..." : "GENERATE PREDICTION"}
            </button>
            {error && (
              <p style={{ color: "var(--red)", marginTop: "15px" }}>{error}</p>
            )}
          </div>
          )}

          {/* Prediction Results */}
          {prediction && (
            <>
              {/* Win Probability */}
              <div className="section">
                <div className="section-title">Win Probability</div>
                <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "20px" }}>
                  <div style={{ flex: 1, textAlign: "right" }}>
                    <span style={{
                      fontFamily: "var(--font-roboto-mono), monospace",
                      fontSize: "36px",
                      fontWeight: "bold",
                      color: prediction.homeWinProb > 50 ? "var(--green)" : "inherit"
                    }}>
                      {prediction.homeWinProb}%
                    </span>
                  </div>
                  <div style={{ flex: 3 }}>
                    <div style={{ display: "flex", height: "30px", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{
                        width: `${prediction.homeWinProb}%`,
                        background: "var(--orange)",
                        transition: "width 0.5s ease"
                      }} />
                      <div style={{
                        width: `${prediction.awayWinProb}%`,
                        background: "var(--blue)",
                        transition: "width 0.5s ease"
                      }} />
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{
                      fontFamily: "var(--font-roboto-mono), monospace",
                      fontSize: "36px",
                      fontWeight: "bold",
                      color: prediction.awayWinProb > 50 ? "var(--green)" : "inherit"
                    }}>
                      {prediction.awayWinProb}%
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.5)" }}>
                  <span>{homeTeam?.name}</span>
                  <span>{awayTeam?.name}</span>
                </div>
              </div>

              {/* Predicted Score & Lines */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginTop: "20px" }}>
                <div className="stat-card">
                  <div style={{ color: "rgba(255,255,255,0.5)", marginBottom: "5px" }}>Predicted Score</div>
                  <div style={{ fontFamily: "var(--font-roboto-mono), monospace", fontSize: "28px", fontWeight: "bold" }}>
                    {prediction.predictedHomeScore} - {prediction.predictedAwayScore}
                  </div>
                </div>
                <div className="stat-card">
                  <div style={{ color: "rgba(255,255,255,0.5)", marginBottom: "5px" }}>Spread</div>
                  <div style={{ fontFamily: "var(--font-roboto-mono), monospace", fontSize: "28px", fontWeight: "bold" }}>
                    {prediction.spread > 0 ? "+" : ""}{prediction.spread.toFixed(1)}
                  </div>
                </div>
                <div className="stat-card">
                  <div style={{ color: "rgba(255,255,255,0.5)", marginBottom: "5px" }}>Total</div>
                  <div style={{ fontFamily: "var(--font-roboto-mono), monospace", fontSize: "28px", fontWeight: "bold" }}>
                    {prediction.total}
                  </div>
                </div>
                <div className="stat-card">
                  <div style={{ color: "rgba(255,255,255,0.5)", marginBottom: "5px" }}>Confidence</div>
                  <div style={{
                    fontFamily: "var(--font-roboto-mono), monospace",
                    fontSize: "28px",
                    fontWeight: "bold",
                    color: prediction.confidence > 75 ? "var(--green)" : prediction.confidence > 60 ? "var(--yellow)" : "var(--red)"
                  }}>
                    {prediction.confidence}%
                  </div>
                </div>
              </div>

              {/* Key Factors */}
              <div className="section" style={{ marginTop: "20px" }}>
                <div className="section-title">Key Prediction Factors</div>
                {prediction.factors.map((factor, index) => (
                  <div key={index} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "15px",
                    background: "rgba(0,0,0,0.3)",
                    marginBottom: "10px"
                  }}>
                    <div>
                      <div style={{ fontWeight: "bold", marginBottom: "5px" }}>{factor.name}</div>
                      <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)" }}>{factor.description}</div>
                    </div>
                    <div style={{
                      fontFamily: "var(--font-roboto-mono), monospace",
                      fontSize: "18px",
                      fontWeight: "bold",
                      color: factor.impact > 0 ? "var(--green)" : "var(--red)"
                    }}>
                      {factor.impact > 0 ? "+" : ""}{factor.impact.toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
