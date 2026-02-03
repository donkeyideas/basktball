"use client";

import { useState, useEffect } from "react";

interface Leader {
  rank: number;
  playerId: string;
  name: string;
  team: string;
  teamName: string;
  value: number;
  gamesPlayed: number;
}

export function FeaturedPlayers() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaders() {
      try {
        const res = await fetch("/api/stats/leaders?category=ppg&limit=3");
        const data = await res.json();
        if (data.success) {
          setLeaders(data.leaders);
        }
      } catch (error) {
        console.error("Failed to fetch leaders:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLeaders();
  }, []);

  if (isLoading) {
    return (
      <section className="featured-players">
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h2 style={{
            fontFamily: "var(--font-anton), Anton, sans-serif",
            fontSize: "48px",
            marginBottom: "50px",
            textAlign: "center"
          }}>
            TOP PERFORMERS
          </h2>
          <div className="players-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="player-card" style={{ opacity: 0.5 }}>
                <div className="player-image">...</div>
                <h3>Loading...</h3>
                <p className="player-team">---</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (leaders.length === 0) {
    return (
      <section className="featured-players">
        <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{
            fontFamily: "var(--font-anton), Anton, sans-serif",
            fontSize: "48px",
            marginBottom: "50px"
          }}>
            TOP PERFORMERS
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)" }}>
            No player stats available yet.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="featured-players">
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h2 style={{
          fontFamily: "var(--font-anton), Anton, sans-serif",
          fontSize: "48px",
          marginBottom: "50px",
          textAlign: "center"
        }}>
          TOP PERFORMERS
        </h2>
        <div className="players-grid">
          {leaders.map((player) => (
            <div key={player.playerId} className="player-card">
              <div className="player-image">
                {player.name.split(" ").map(n => n[0]).join("")}
              </div>
              <h3>{player.name}</h3>
              <p className="player-team">{player.teamName}</p>
              <div className="player-stats">
                <div className="stat">
                  <div className="stat-value">{player.value}</div>
                  <div className="stat-label">PPG</div>
                </div>
                <div className="stat">
                  <div className="stat-value">{player.gamesPlayed}</div>
                  <div className="stat-label">GP</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturedPlayers;
