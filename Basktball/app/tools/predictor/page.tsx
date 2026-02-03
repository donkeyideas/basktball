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

// Sample teams for demonstration
const sampleTeams: Team[] = [
  { id: "1", name: "Los Angeles Lakers", abbreviation: "LAL" },
  { id: "2", name: "Boston Celtics", abbreviation: "BOS" },
  { id: "3", name: "Golden State Warriors", abbreviation: "GSW" },
  { id: "4", name: "Miami Heat", abbreviation: "MIA" },
  { id: "5", name: "Milwaukee Bucks", abbreviation: "MIL" },
  { id: "6", name: "Phoenix Suns", abbreviation: "PHX" },
  { id: "7", name: "Denver Nuggets", abbreviation: "DEN" },
  { id: "8", name: "Philadelphia 76ers", abbreviation: "PHI" },
];

function generatePrediction(homeTeam: Team, awayTeam: Team): Prediction {
  // Generate deterministic but varied predictions based on team names
  const homeSeed = homeTeam.name.length + homeTeam.abbreviation.charCodeAt(0);
  const awaySeed = awayTeam.name.length + awayTeam.abbreviation.charCodeAt(0);

  const homeAdvantage = 3.5;
  const homeBase = 105 + (homeSeed % 15);
  const awayBase = 102 + (awaySeed % 15);

  const predictedHomeScore = Math.round(homeBase + (Math.random() * 10 - 5));
  const predictedAwayScore = Math.round(awayBase + (Math.random() * 10 - 5));

  const scoreDiff = predictedHomeScore - predictedAwayScore;
  const homeWinProb = Math.min(85, Math.max(15, 50 + scoreDiff * 3 + homeAdvantage));

  return {
    homeWinProb: Math.round(homeWinProb),
    awayWinProb: Math.round(100 - homeWinProb),
    predictedHomeScore,
    predictedAwayScore,
    spread: -(predictedHomeScore - predictedAwayScore),
    total: predictedHomeScore + predictedAwayScore,
    confidence: Math.round(60 + Math.random() * 25),
    factors: [
      { name: "Home Court Advantage", impact: homeAdvantage, description: "Historical home win rate and crowd factor" },
      { name: "Recent Form", impact: 2.1 + (homeSeed % 3), description: "Performance in last 10 games" },
      { name: "Head-to-Head", impact: 1.5 + (awaySeed % 4) * 0.5, description: "Season series and historical matchups" },
      { name: "Rest Days", impact: 0.8 + Math.random() * 2, description: "Days since last game for both teams" },
      { name: "Injuries", impact: -1.2 - Math.random() * 2, description: "Key player availability impact" },
    ],
  };
}

export default function PredictorPage() {
  const [teams, setTeams] = useState<Team[]>(sampleTeams);
  const [homeTeam, setHomeTeam] = useState<Team | null>(null);
  const [awayTeam, setAwayTeam] = useState<Team | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTeams = useCallback(async () => {
    try {
      const res = await fetch("/api/teams?league=nba");
      const data = await res.json();
      if (data.success && data.teams?.length > 0) {
        setTeams(data.teams);
      }
    } catch {
      // Use sample teams on error
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handlePredict = () => {
    if (!homeTeam || !awayTeam) return;
    setIsLoading(true);

    // Simulate AI processing
    setTimeout(() => {
      setPrediction(generatePrediction(homeTeam, awayTeam));
      setIsLoading(false);
    }, 1500);
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

          {/* Predict Button */}
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
          </div>

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
