"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { Header, Footer } from "@/components";

interface Team {
  id: string;
  name: string;
  abbreviation: string;
  logo: string;
  score: number;
  winner?: boolean;
}

interface PlayerStat {
  id: string;
  name: string;
  shortName: string;
  headshot?: string;
  jersey?: string;
  position?: string;
  starter: boolean;
  dnp: boolean;
  dnpReason?: string;
  stats: Record<string, string>;
}

interface GameData {
  id: string;
  date: string;
  status: "scheduled" | "live" | "final";
  statusDescription: string;
  period: number;
  clock: string;
  venue?: string;
  location?: string;
  homeTeam: Team;
  awayTeam: Team;
}

interface GameDetailsResponse {
  success: boolean;
  game: GameData;
  teamStats: Record<string, Record<string, string>>;
  playerStats: Array<{
    teamId: string;
    teamName: string;
    players: PlayerStat[];
  }>;
}

function StatComparison({
  label,
  home,
  away,
}: {
  label: string;
  home: string;
  away: string;
}) {
  const homeNum = parseFloat(home) || 0;
  const awayNum = parseFloat(away) || 0;
  const total = homeNum + awayNum || 1;
  const homePercent = (homeNum / total) * 100;

  return (
    <div style={{ marginBottom: "15px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
        <span style={{ fontWeight: "bold" }}>{home}</span>
        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>{label}</span>
        <span style={{ fontWeight: "bold" }}>{away}</span>
      </div>
      <div style={{
        display: "flex",
        height: "8px",
        background: "rgba(255,255,255,0.1)",
        borderRadius: "4px",
        overflow: "hidden",
      }}>
        <div style={{
          width: `${homePercent}%`,
          background: "var(--orange)",
          transition: "width 0.3s ease",
        }} />
        <div style={{
          width: `${100 - homePercent}%`,
          background: "var(--red)",
          transition: "width 0.3s ease",
        }} />
      </div>
    </div>
  );
}

function BoxScoreTable({ players, teamName }: { players: PlayerStat[]; teamName: string }) {
  const starters = players.filter(p => p.starter && !p.dnp);
  const bench = players.filter(p => !p.starter && !p.dnp);
  const dnp = players.filter(p => p.dnp);

  const statColumns = ["MIN", "PTS", "REB", "AST", "FG", "3PT", "FT", "STL", "BLK", "TO"];

  const renderPlayerRow = (player: PlayerStat) => (
    <tr key={player.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
      <td style={{ padding: "12px 10px", display: "flex", alignItems: "center", gap: "10px" }}>
        {player.headshot ? (
          <Image
            src={player.headshot}
            alt={player.name}
            width={32}
            height={32}
            style={{ borderRadius: "50%", background: "rgba(255,255,255,0.1)" }}
          />
        ) : (
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "var(--orange)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: "bold",
          }}>
            {player.jersey || player.shortName.charAt(0)}
          </div>
        )}
        <Link
          href={`/player/${player.id}`}
          style={{
            color: "var(--white)",
            textDecoration: "none",
            fontWeight: "500",
          }}
        >
          {player.shortName}
          {player.position && (
            <span style={{ color: "rgba(255,255,255,0.5)", marginLeft: "5px", fontSize: "12px" }}>
              {player.position}
            </span>
          )}
        </Link>
      </td>
      {statColumns.map(col => (
        <td key={col} style={{ padding: "12px 8px", textAlign: "center", fontSize: "14px" }}>
          {player.stats[col] || "-"}
        </td>
      ))}
    </tr>
  );

  return (
    <div style={{ marginBottom: "40px" }}>
      <h3 style={{
        fontFamily: "var(--font-anton), Anton, sans-serif",
        fontSize: "24px",
        marginBottom: "20px",
        color: "var(--orange)",
      }}>
        {teamName}
      </h3>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.05)" }}>
              <th style={{ padding: "12px 10px", textAlign: "left", fontWeight: "600" }}>PLAYER</th>
              {statColumns.map(col => (
                <th key={col} style={{ padding: "12px 8px", textAlign: "center", fontWeight: "600", fontSize: "12px" }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {starters.length > 0 && (
              <>
                <tr>
                  <td colSpan={statColumns.length + 1} style={{
                    padding: "8px 10px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: "rgba(255,255,255,0.5)",
                    background: "rgba(255,255,255,0.02)",
                  }}>
                    STARTERS
                  </td>
                </tr>
                {starters.map(renderPlayerRow)}
              </>
            )}
            {bench.length > 0 && (
              <>
                <tr>
                  <td colSpan={statColumns.length + 1} style={{
                    padding: "8px 10px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: "rgba(255,255,255,0.5)",
                    background: "rgba(255,255,255,0.02)",
                  }}>
                    BENCH
                  </td>
                </tr>
                {bench.map(renderPlayerRow)}
              </>
            )}
            {dnp.length > 0 && (
              <>
                <tr>
                  <td colSpan={statColumns.length + 1} style={{
                    padding: "8px 10px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: "rgba(255,255,255,0.5)",
                    background: "rgba(255,255,255,0.02)",
                  }}>
                    DID NOT PLAY
                  </td>
                </tr>
                {dnp.map(player => (
                  <tr key={player.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td colSpan={statColumns.length + 1} style={{ padding: "10px", color: "rgba(255,255,255,0.4)" }}>
                      {player.shortName} - {player.dnpReason || "DNP"}
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<GameDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGame() {
      try {
        const res = await fetch(`/api/games/${id}`);
        const json = await res.json();
        if (json.success) {
          setData(json);
        } else {
          setError(json.error || "Failed to load game");
        }
      } catch {
        setError("Failed to connect to server");
      } finally {
        setIsLoading(false);
      }
    }
    fetchGame();

    // Auto-refresh for live games
    const interval = setInterval(() => {
      if (data?.game.status === "live") {
        fetchGame();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [id, data?.game.status]);

  if (isLoading) {
    return (
      <>
        <Header />
        <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
          <div style={{ textAlign: "center", padding: "100px" }}>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading game data...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <Header />
        <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
          <div style={{ textAlign: "center", padding: "100px" }}>
            <p style={{ color: "var(--red)", marginBottom: "20px" }}>{error || "Game not found"}</p>
            <Link href="/live" className="btn btn-primary">Back to Live Scores</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const { game, teamStats, playerStats } = data;
  const homeStats = teamStats[game.homeTeam.abbreviation] || {};
  const awayStats = teamStats[game.awayTeam.abbreviation] || {};

  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          {/* Back Link */}
          <Link
            href="/live"
            style={{
              color: "rgba(255,255,255,0.5)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              marginBottom: "30px",
            }}
          >
            ← Back to Live Scores
          </Link>

          {/* Game Header */}
          <div style={{
            background: "var(--dark-gray)",
            padding: "40px",
            marginBottom: "40px",
            position: "relative",
          }}>
            {/* Status Badge */}
            <div style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              padding: "8px 20px",
              background: game.status === "live" ? "var(--red)" :
                         game.status === "final" ? "rgba(255,255,255,0.2)" : "var(--orange)",
              fontWeight: "bold",
              fontSize: "14px",
              letterSpacing: "1px",
              animation: game.status === "live" ? "blink 1s ease-in-out infinite" : "none",
            }}>
              {game.status === "live" ? `${game.statusDescription}` :
               game.status === "final" ? "FINAL" : game.statusDescription}
            </div>

            {/* Matchup */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "60px",
              flexWrap: "wrap",
            }}>
              {/* Away Team */}
              <div style={{ textAlign: "center" }}>
                {game.awayTeam.logo ? (
                  <Image
                    src={game.awayTeam.logo}
                    alt={game.awayTeam.name}
                    width={100}
                    height={100}
                    style={{ objectFit: "contain", marginBottom: "15px" }}
                    unoptimized
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                ) : (
                  <div style={{
                    width: "100px",
                    height: "100px",
                    background: "var(--orange)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "32px",
                    fontWeight: "bold",
                    marginBottom: "15px",
                  }}>
                    {game.awayTeam.abbreviation}
                  </div>
                )}
                <h2 style={{
                  fontFamily: "var(--font-anton), Anton, sans-serif",
                  fontSize: "24px",
                  marginBottom: "5px",
                }}>
                  {game.awayTeam.name}
                </h2>
                <p style={{ color: "rgba(255,255,255,0.5)" }}>{game.awayTeam.abbreviation}</p>
              </div>

              {/* Score */}
              <div style={{ textAlign: "center" }}>
                <div style={{
                  fontFamily: "var(--font-anton), Anton, sans-serif",
                  fontSize: "72px",
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                }}>
                  <span style={{ color: game.awayTeam.winner ? "var(--orange)" : "var(--white)" }}>
                    {game.awayTeam.score}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "48px" }}>-</span>
                  <span style={{ color: game.homeTeam.winner ? "var(--orange)" : "var(--white)" }}>
                    {game.homeTeam.score}
                  </span>
                </div>
                {game.venue && (
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", marginTop: "10px" }}>
                    {game.venue}
                    {game.location && ` • ${game.location}`}
                  </p>
                )}
              </div>

              {/* Home Team */}
              <div style={{ textAlign: "center" }}>
                {game.homeTeam.logo ? (
                  <Image
                    src={game.homeTeam.logo}
                    alt={game.homeTeam.name}
                    width={100}
                    height={100}
                    style={{ objectFit: "contain", marginBottom: "15px" }}
                    unoptimized
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                ) : (
                  <div style={{
                    width: "100px",
                    height: "100px",
                    background: "var(--orange)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "32px",
                    fontWeight: "bold",
                    marginBottom: "15px",
                  }}>
                    {game.homeTeam.abbreviation}
                  </div>
                )}
                <h2 style={{
                  fontFamily: "var(--font-anton), Anton, sans-serif",
                  fontSize: "24px",
                  marginBottom: "5px",
                }}>
                  {game.homeTeam.name}
                </h2>
                <p style={{ color: "rgba(255,255,255,0.5)" }}>{game.homeTeam.abbreviation}</p>
              </div>
            </div>
          </div>

          {/* Team Stats Comparison */}
          {Object.keys(homeStats).length > 0 && (
            <div style={{ marginBottom: "60px" }}>
              <h2 style={{
                fontFamily: "var(--font-anton), Anton, sans-serif",
                fontSize: "32px",
                marginBottom: "30px",
                textAlign: "center",
              }}>
                TEAM STATS
              </h2>
              <div style={{
                background: "var(--dark-gray)",
                padding: "30px",
                maxWidth: "600px",
                margin: "0 auto",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                  <span style={{ fontWeight: "bold", color: "var(--orange)" }}>{game.homeTeam.abbreviation}</span>
                  <span style={{ fontWeight: "bold", color: "var(--red)" }}>{game.awayTeam.abbreviation}</span>
                </div>
                <StatComparison label="Field Goals" home={homeStats["fieldGoalsMade-fieldGoalsAttempted"] || "0"} away={awayStats["fieldGoalsMade-fieldGoalsAttempted"] || "0"} />
                <StatComparison label="FG%" home={homeStats["fieldGoalPct"] || "0"} away={awayStats["fieldGoalPct"] || "0"} />
                <StatComparison label="3-Pointers" home={homeStats["threePointFieldGoalsMade-threePointFieldGoalsAttempted"] || "0"} away={awayStats["threePointFieldGoalsMade-threePointFieldGoalsAttempted"] || "0"} />
                <StatComparison label="3PT%" home={homeStats["threePointFieldGoalPct"] || "0"} away={awayStats["threePointFieldGoalPct"] || "0"} />
                <StatComparison label="Free Throws" home={homeStats["freeThrowsMade-freeThrowsAttempted"] || "0"} away={awayStats["freeThrowsMade-freeThrowsAttempted"] || "0"} />
                <StatComparison label="Rebounds" home={homeStats["totalRebounds"] || "0"} away={awayStats["totalRebounds"] || "0"} />
                <StatComparison label="Assists" home={homeStats["assists"] || "0"} away={awayStats["assists"] || "0"} />
                <StatComparison label="Steals" home={homeStats["steals"] || "0"} away={awayStats["steals"] || "0"} />
                <StatComparison label="Blocks" home={homeStats["blocks"] || "0"} away={awayStats["blocks"] || "0"} />
                <StatComparison label="Turnovers" home={homeStats["turnovers"] || "0"} away={awayStats["turnovers"] || "0"} />
              </div>
            </div>
          )}

          {/* Box Scores */}
          {playerStats.length > 0 && (
            <div>
              <h2 style={{
                fontFamily: "var(--font-anton), Anton, sans-serif",
                fontSize: "32px",
                marginBottom: "30px",
                textAlign: "center",
              }}>
                BOX SCORE
              </h2>
              <div style={{ background: "var(--dark-gray)", padding: "30px" }}>
                {playerStats.map((team) => (
                  <BoxScoreTable
                    key={team.teamId}
                    players={team.players}
                    teamName={team.teamName}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
