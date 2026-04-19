"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface TodayPerformer {
  playerId: string;
  name: string;
  team: string;
  teamName: string;
  teamLogo: string;
  points: number;
  rebounds: number;
  assists: number;
  imageUrl: string;
  gameId: string;
  gameStatus: "live" | "final";
}

interface SeasonLeader {
  rank: number;
  playerId: string;
  name: string;
  team: string;
  teamName: string;
  value: number;
  gamesPlayed: number;
  imageUrl?: string;
}

type DisplayMode = "today" | "season";

export function FeaturedPlayers() {
  const [todayPerformers, setTodayPerformers] = useState<TodayPerformer[]>([]);
  const [seasonLeaders, setSeasonLeaders] = useState<SeasonLeader[]>([]);
  const [mode, setMode] = useState<DisplayMode>("today");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch today's performers first
        const todayRes = await fetch("/api/stats/today-performers");
        const todayData = await todayRes.json();

        if (todayData.success && todayData.performers?.length > 0) {
          setTodayPerformers(todayData.performers);
          setMode("today");
        } else {
          // No live/completed games today — fall back to season leaders
          const seasonRes = await fetch("/api/stats/leaders?category=ppg&limit=3");
          const seasonData = await seasonRes.json();
          if (seasonData.success) {
            setSeasonLeaders(seasonData.leaders);
          }
          setMode("season");
        }
      } catch (error) {
        console.error("Failed to fetch performers:", error);
        // On error, try season leaders as fallback
        try {
          const seasonRes = await fetch("/api/stats/leaders?category=ppg&limit=3");
          const seasonData = await seasonRes.json();
          if (seasonData.success) {
            setSeasonLeaders(seasonData.leaders);
          }
        } catch {
          // Both failed
        }
        setMode("season");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();

    // Auto-refresh every 2 minutes for live game updates
    const interval = setInterval(fetchData, 120000);
    return () => clearInterval(interval);
  }, []);

  const todayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  if (isLoading) {
    return (
      <section className="featured-players">
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h2 style={{
            fontFamily: "var(--font-anton), Anton, sans-serif",
            fontSize: "48px",
            marginBottom: "8px",
            textAlign: "center"
          }}>
            TOP PERFORMERS
          </h2>
          <p style={{
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: "14px",
            marginBottom: "50px",
            textTransform: "uppercase",
            letterSpacing: "2px",
          }}>
            Loading...
          </p>
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

  // Today's top performers view
  if (mode === "today" && todayPerformers.length > 0) {
    return (
      <section className="featured-players">
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h2 style={{
            fontFamily: "var(--font-anton), Anton, sans-serif",
            fontSize: "48px",
            marginBottom: "8px",
            textAlign: "center"
          }}>
            {"TODAY'S TOP PERFORMERS"}
          </h2>
          <p style={{
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: "14px",
            marginBottom: "50px",
            textTransform: "uppercase",
            letterSpacing: "2px",
          }}>
            {todayDate}
          </p>
          <div className="players-grid">
            {todayPerformers.map((player) => (
              <Link
                key={`${player.playerId}-${player.gameId}`}
                href={`/player/${player.playerId}`}
                className="player-card"
                style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}
              >
                {player.gameStatus === "live" && (
                  <span style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    background: "#e53935",
                    color: "var(--white)",
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: "4px",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}>
                    LIVE
                  </span>
                )}
                <div className="player-image" style={{ overflow: "hidden", position: "relative" }}>
                  {player.imageUrl ? (
                    <Image
                      src={player.imageUrl}
                      alt={player.name}
                      fill
                      style={{ objectFit: "cover", objectPosition: "top" }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        if (target.parentElement) {
                          target.parentElement.innerHTML = `<span style="font-size: 40px; font-family: var(--font-anton)">${player.name.split(" ").map(n => n[0]).join("")}</span>`;
                        }
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: "40px", fontFamily: "var(--font-anton)" }}>
                      {player.name.split(" ").map(n => n[0]).join("")}
                    </span>
                  )}
                </div>
                <h3>{player.name}</h3>
                <p className="player-team">{player.teamName}</p>
                <div className="player-stats">
                  <div className="stat">
                    <div className="stat-value">{player.points}</div>
                    <div className="stat-label">PTS</div>
                  </div>
                  <div className="stat">
                    <div className="stat-value">{player.rebounds}</div>
                    <div className="stat-label">REB</div>
                  </div>
                  <div className="stat">
                    <div className="stat-value">{player.assists}</div>
                    <div className="stat-label">AST</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Season leaders fallback view
  if (seasonLeaders.length === 0) {
    return (
      <section className="featured-players">
        <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{
            fontFamily: "var(--font-anton), Anton, sans-serif",
            fontSize: "48px",
            marginBottom: "8px"
          }}>
            TOP PERFORMERS
          </h2>
          <p style={{
            color: "var(--text-muted)",
            fontSize: "14px",
            marginBottom: "50px",
            textTransform: "uppercase",
            letterSpacing: "2px",
          }}>
            No games scheduled yet today
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
          marginBottom: "8px",
          textAlign: "center"
        }}>
          TOP PERFORMERS
        </h2>
        <p style={{
          textAlign: "center",
          color: "var(--text-muted)",
          fontSize: "14px",
          marginBottom: "50px",
          textTransform: "uppercase",
          letterSpacing: "2px",
        }}>
          2025-26 Season Leaders
        </p>
        <div className="players-grid">
          {seasonLeaders.map((player) => (
            <Link key={player.playerId} href={`/player/${player.playerId}`} className="player-card" style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}>
              <div className="player-image" style={{ overflow: "hidden", position: "relative" }}>
                {player.imageUrl ? (
                  <Image
                    src={player.imageUrl}
                    alt={player.name}
                    fill
                    style={{ objectFit: "cover", objectPosition: "top" }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      if (target.parentElement) {
                        target.parentElement.innerHTML = `<span style="font-size: 40px; font-family: var(--font-anton)">${player.name.split(" ").map(n => n[0]).join("")}</span>`;
                      }
                    }}
                  />
                ) : (
                  <span style={{ fontSize: "40px", fontFamily: "var(--font-anton)" }}>
                    {player.name.split(" ").map(n => n[0]).join("")}
                  </span>
                )}
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
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturedPlayers;
