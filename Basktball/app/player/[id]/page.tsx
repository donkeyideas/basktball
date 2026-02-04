"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { Header, Footer } from "@/components";

interface PlayerTeam {
  id: string;
  name: string;
  abbreviation: string;
  logoUrl?: string;
}

interface Player {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  position?: string;
  jerseyNumber?: string;
  height?: string;
  weight?: number;
  college?: string;
  country?: string;
  team?: PlayerTeam;
  headshotUrl?: string;
}

interface SeasonAverages {
  pts?: number;
  reb?: number;
  ast?: number;
  stl?: number;
  blk?: number;
  turnover?: number;
  min?: string;
  fgm?: number;
  fga?: number;
  fg_pct?: number;
  fg3m?: number;
  fg3a?: number;
  fg3_pct?: number;
  ftm?: number;
  fta?: number;
  ft_pct?: number;
  games_played?: number;
}

interface PlayerDetailsResponse {
  success: boolean;
  player: Player;
  seasonAverages?: SeasonAverages;
  error?: string;
}

function StatCard({ label, value, suffix }: { label: string; value: string | number; suffix?: string }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.05)",
      padding: "20px",
      textAlign: "center",
      borderRadius: "8px",
    }}>
      <div style={{
        fontFamily: "var(--font-anton), Anton, sans-serif",
        fontSize: "36px",
        color: "var(--orange)",
        marginBottom: "5px",
      }}>
        {value}{suffix}
      </div>
      <div style={{
        fontSize: "12px",
        color: "rgba(255,255,255,0.5)",
        textTransform: "uppercase",
        letterSpacing: "1px",
      }}>
        {label}
      </div>
    </div>
  );
}

function ShootingChart({ fgPct, fg3Pct, ftPct }: { fgPct: number; fg3Pct: number; ftPct: number }) {
  const bars = [
    { label: "FG%", value: fgPct, color: "var(--orange)" },
    { label: "3PT%", value: fg3Pct, color: "var(--red)" },
    { label: "FT%", value: ftPct, color: "#4CAF50" },
  ];

  return (
    <div style={{ marginTop: "20px" }}>
      <h4 style={{
        fontSize: "14px",
        color: "rgba(255,255,255,0.5)",
        marginBottom: "15px",
        textTransform: "uppercase",
        letterSpacing: "1px",
      }}>
        Shooting Splits
      </h4>
      {bars.map(bar => (
        <div key={bar.label} style={{ marginBottom: "15px" }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "5px",
            fontSize: "14px",
          }}>
            <span>{bar.label}</span>
            <span style={{ fontWeight: "bold" }}>{bar.value.toFixed(1)}%</span>
          </div>
          <div style={{
            height: "8px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "4px",
            overflow: "hidden",
          }}>
            <div style={{
              width: `${bar.value}%`,
              height: "100%",
              background: bar.color,
              transition: "width 0.5s ease",
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<PlayerDetailsResponse | null>(null);
  const [dbStats, setDbStats] = useState<{
    ppg: number;
    rpg: number;
    apg: number;
    spg: number;
    bpg: number;
    fgPct: number;
    threePct: number;
    ftPct: number;
    mpg: number;
    tov: number;
    gamesPlayed: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlayer() {
      try {
        // Fetch from both endpoints
        const [apiRes, dbRes] = await Promise.all([
          fetch(`/api/players?id=${id}`),
          fetch(`/api/players/${id}/stats`),
        ]);

        const apiData = await apiRes.json();
        const dbData = await dbRes.json();

        if (apiData.success) {
          setData(apiData);
        } else {
          setError(apiData.error || "Failed to load player");
        }

        if (dbData.success && dbData.stats) {
          setDbStats(dbData.stats);
        }
      } catch {
        setError("Failed to connect to server");
      } finally {
        setIsLoading(false);
      }
    }
    fetchPlayer();
  }, [id]);

  if (isLoading) {
    return (
      <>
        <Header />
        <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
          <div style={{ textAlign: "center", padding: "100px" }}>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading player data...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !data?.player) {
    return (
      <>
        <Header />
        <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
          <div style={{ textAlign: "center", padding: "100px" }}>
            <p style={{ color: "var(--red)", marginBottom: "20px" }}>{error || "Player not found"}</p>
            <Link href="/players" className="btn btn-primary">Back to Players</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const { player, seasonAverages } = data;

  // Use database stats if available, otherwise API stats
  const stats = dbStats || {
    ppg: seasonAverages?.pts || 0,
    rpg: seasonAverages?.reb || 0,
    apg: seasonAverages?.ast || 0,
    spg: seasonAverages?.stl || 0,
    bpg: seasonAverages?.blk || 0,
    fgPct: (seasonAverages?.fg_pct || 0) * 100,
    threePct: (seasonAverages?.fg3_pct || 0) * 100,
    ftPct: (seasonAverages?.ft_pct || 0) * 100,
    mpg: parseFloat(seasonAverages?.min || "0"),
    tov: seasonAverages?.turnover || 0,
    gamesPlayed: seasonAverages?.games_played || 0,
  };

  // NBA headshot URL
  const headshotUrl = player.headshotUrl ||
    `https://cdn.nba.com/headshots/nba/latest/1040x760/${player.id}.png`;

  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {/* Back Link */}
          <Link
            href="/players"
            style={{
              color: "rgba(255,255,255,0.5)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              marginBottom: "30px",
            }}
          >
            ← Back to Player Search
          </Link>

          {/* Player Header */}
          <div style={{
            background: "var(--dark-gray)",
            padding: "40px",
            marginBottom: "40px",
            display: "flex",
            gap: "40px",
            flexWrap: "wrap",
            alignItems: "center",
          }}>
            {/* Player Photo */}
            <div style={{
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              overflow: "hidden",
              background: "rgba(255,255,255,0.1)",
              border: "4px solid var(--orange)",
              flexShrink: 0,
            }}>
              <Image
                src={headshotUrl}
                alt={player.name}
                width={200}
                height={200}
                style={{ objectFit: "cover", objectPosition: "top" }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            </div>

            {/* Player Info */}
            <div style={{ flex: 1 }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "15px",
                marginBottom: "10px",
              }}>
                {player.jerseyNumber && (
                  <span style={{
                    fontFamily: "var(--font-anton), Anton, sans-serif",
                    fontSize: "48px",
                    color: "var(--orange)",
                  }}>
                    #{player.jerseyNumber}
                  </span>
                )}
                <h1 style={{
                  fontFamily: "var(--font-anton), Anton, sans-serif",
                  fontSize: "48px",
                }}>
                  {player.name}
                </h1>
              </div>

              <div style={{
                display: "flex",
                gap: "30px",
                flexWrap: "wrap",
                marginBottom: "20px",
              }}>
                {player.team && (
                  <div>
                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>TEAM</span>
                    <p style={{ color: "var(--orange)", fontWeight: "bold", fontSize: "18px" }}>
                      {player.team.name}
                    </p>
                  </div>
                )}
                {player.position && (
                  <div>
                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>POSITION</span>
                    <p style={{ fontWeight: "bold", fontSize: "18px" }}>{player.position}</p>
                  </div>
                )}
                {player.height && (
                  <div>
                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>HEIGHT</span>
                    <p style={{ fontWeight: "bold", fontSize: "18px" }}>{player.height}</p>
                  </div>
                )}
                {player.weight && (
                  <div>
                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>WEIGHT</span>
                    <p style={{ fontWeight: "bold", fontSize: "18px" }}>{player.weight} lbs</p>
                  </div>
                )}
                {player.college && (
                  <div>
                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>COLLEGE</span>
                    <p style={{ fontWeight: "bold", fontSize: "18px" }}>{player.college}</p>
                  </div>
                )}
                {player.country && player.country !== "USA" && (
                  <div>
                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>COUNTRY</span>
                    <p style={{ fontWeight: "bold", fontSize: "18px" }}>{player.country}</p>
                  </div>
                )}
              </div>

              {stats.gamesPlayed > 0 && (
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>
                  {stats.gamesPlayed} games played this season
                </p>
              )}
            </div>
          </div>

          {/* Season Stats */}
          <h2 style={{
            fontFamily: "var(--font-anton), Anton, sans-serif",
            fontSize: "32px",
            marginBottom: "30px",
            textAlign: "center",
          }}>
            SEASON AVERAGES
          </h2>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: "15px",
            marginBottom: "40px",
          }}>
            <StatCard label="Points" value={stats.ppg.toFixed(1)} />
            <StatCard label="Rebounds" value={stats.rpg.toFixed(1)} />
            <StatCard label="Assists" value={stats.apg.toFixed(1)} />
            <StatCard label="Steals" value={stats.spg.toFixed(1)} />
            <StatCard label="Blocks" value={stats.bpg.toFixed(1)} />
            <StatCard label="Minutes" value={stats.mpg.toFixed(1)} />
          </div>

          {/* Shooting Stats */}
          <div style={{
            background: "var(--dark-gray)",
            padding: "30px",
            maxWidth: "500px",
            margin: "0 auto",
          }}>
            <h3 style={{
              fontFamily: "var(--font-anton), Anton, sans-serif",
              fontSize: "24px",
              marginBottom: "20px",
              textAlign: "center",
            }}>
              SHOOTING EFFICIENCY
            </h3>
            <ShootingChart
              fgPct={stats.fgPct}
              fg3Pct={stats.threePct}
              ftPct={stats.ftPct}
            />
          </div>

          {/* Additional Stats Table */}
          <div style={{ marginTop: "40px" }}>
            <h3 style={{
              fontFamily: "var(--font-anton), Anton, sans-serif",
              fontSize: "24px",
              marginBottom: "20px",
              textAlign: "center",
            }}>
              DETAILED STATISTICS
            </h3>
            <div style={{
              background: "var(--dark-gray)",
              padding: "30px",
              overflowX: "auto",
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid rgba(255,255,255,0.1)" }}>
                    <th style={{ padding: "12px", textAlign: "left" }}>Stat</th>
                    <th style={{ padding: "12px", textAlign: "right" }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "12px" }}>Points Per Game</td>
                    <td style={{ padding: "12px", textAlign: "right", fontWeight: "bold" }}>{stats.ppg.toFixed(1)}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "12px" }}>Rebounds Per Game</td>
                    <td style={{ padding: "12px", textAlign: "right", fontWeight: "bold" }}>{stats.rpg.toFixed(1)}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "12px" }}>Assists Per Game</td>
                    <td style={{ padding: "12px", textAlign: "right", fontWeight: "bold" }}>{stats.apg.toFixed(1)}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "12px" }}>Steals Per Game</td>
                    <td style={{ padding: "12px", textAlign: "right", fontWeight: "bold" }}>{stats.spg.toFixed(1)}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "12px" }}>Blocks Per Game</td>
                    <td style={{ padding: "12px", textAlign: "right", fontWeight: "bold" }}>{stats.bpg.toFixed(1)}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "12px" }}>Turnovers Per Game</td>
                    <td style={{ padding: "12px", textAlign: "right", fontWeight: "bold" }}>{stats.tov.toFixed(1)}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "12px" }}>Field Goal %</td>
                    <td style={{ padding: "12px", textAlign: "right", fontWeight: "bold" }}>{stats.fgPct.toFixed(1)}%</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "12px" }}>3-Point %</td>
                    <td style={{ padding: "12px", textAlign: "right", fontWeight: "bold" }}>{stats.threePct.toFixed(1)}%</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "12px" }}>Free Throw %</td>
                    <td style={{ padding: "12px", textAlign: "right", fontWeight: "bold" }}>{stats.ftPct.toFixed(1)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
