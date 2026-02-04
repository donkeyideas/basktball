"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Header, Footer } from "@/components";

interface Team {
  id: string;
  name: string;
  abbreviation: string;
  city: string;
  conference?: string;
  division?: string;
  logoUrl?: string;
  league?: string;
}

interface Player {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  position?: string;
  jerseyNumber?: string;
  headshotUrl?: string;
}

interface Game {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  status: "scheduled" | "live" | "final";
  gameDate: string;
}

interface TeamStats {
  wins: number;
  losses: number;
  winPct: number;
  ppg: number;
  oppPpg: number;
  recentGames: Array<{ opponent: string; result: string; score: string }>;
}

type Tab = "overview" | "roster" | "schedule";

const LEAGUE_NAMES: Record<string, string> = {
  nba: "NBA",
  wnba: "WNBA",
  ncaam: "NCAA Men's Basketball",
  ncaaw: "NCAA Women's Basketball",
};

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const league = params.league as string;
  const teamId = params.id as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [roster, setRoster] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Fetch team info
  useEffect(() => {
    async function fetchTeam() {
      try {
        if (league === "nba") {
          const res = await fetch(`/api/teams?id=${teamId}`);
          const data = await res.json();
          if (data.success && data.team) {
            setTeam(data.team);
          } else {
            setError("Team not found");
          }
        } else {
          const res = await fetch(`/api/teams?league=${league}`);
          const data = await res.json();
          if (data.success && data.teams) {
            const foundTeam = data.teams.find((t: Team) => t.id === teamId);
            if (foundTeam) {
              setTeam(foundTeam);
            } else {
              setError("Team not found");
            }
          } else {
            setError("Failed to load team");
          }
        }
      } catch {
        setError("Failed to connect to server");
      } finally {
        setIsLoading(false);
      }
    }
    fetchTeam();
  }, [league, teamId]);

  // Fetch team stats (NBA only)
  useEffect(() => {
    if (league !== "nba") return;

    async function fetchStats() {
      try {
        const res = await fetch(`/api/teams/${teamId}/stats?league=${league}`);
        const data = await res.json();
        if (data.success && data.stats) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    }
    fetchStats();
  }, [teamId, league]);

  // Fetch roster (NBA only)
  useEffect(() => {
    if (league !== "nba") return;

    async function fetchRoster() {
      try {
        const res = await fetch(`/api/teams/${teamId}/roster?league=${league}`);
        const data = await res.json();
        if (data.success && data.players) {
          setRoster(data.players);
        }
      } catch (err) {
        console.error("Failed to fetch roster:", err);
      }
    }
    fetchRoster();
  }, [teamId, league]);

  // Fetch games (NBA only)
  useEffect(() => {
    if (league !== "nba") return;

    async function fetchGames() {
      try {
        const res = await fetch(`/api/teams/${teamId}/games?league=${league}`);
        const data = await res.json();
        if (data.success && data.games) {
          setGames(data.games);
        }
      } catch (err) {
        console.error("Failed to fetch games:", err);
      }
    }
    fetchGames();
  }, [teamId, league]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "roster", label: "Roster" },
    { id: "schedule", label: "Schedule" },
  ];

  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          {/* Back button */}
          <Link
            href="/teams"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              color: "var(--orange)",
              textDecoration: "none",
              marginBottom: "30px",
              fontFamily: "var(--font-barlow), sans-serif",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            &larr; Back to Teams
          </Link>

          {isLoading ? (
            <div style={{ textAlign: "center", padding: "60px" }}>
              <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading team...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "60px" }}>
              <p style={{ color: "var(--red)" }}>{error}</p>
              <button
                onClick={() => router.push("/teams")}
                style={{
                  marginTop: "20px",
                  padding: "12px 24px",
                  background: "var(--orange)",
                  border: "none",
                  color: "var(--white)",
                  cursor: "pointer",
                  fontFamily: "var(--font-barlow), sans-serif",
                }}
              >
                Return to Teams
              </button>
            </div>
          ) : team ? (
            <>
              {/* Team Header */}
              <div
                className="section"
                style={{
                  padding: "30px",
                  display: "flex",
                  alignItems: "center",
                  gap: "30px",
                  marginBottom: "20px",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    width: "120px",
                    height: "120px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  {team.logoUrl ? (
                    <Image
                      src={team.logoUrl}
                      alt={team.name}
                      width={100}
                      height={100}
                      style={{ objectFit: "contain" }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        if (target.parentElement) {
                          target.parentElement.textContent = team.abbreviation;
                        }
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        fontFamily: "var(--font-anton), Anton, sans-serif",
                        fontSize: "36px",
                      }}
                    >
                      {team.abbreviation}
                    </span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "inline-block",
                      padding: "4px 12px",
                      background: "var(--orange)",
                      marginBottom: "10px",
                      fontFamily: "var(--font-barlow), sans-serif",
                      fontSize: "11px",
                      fontWeight: "600",
                      letterSpacing: "1px",
                    }}
                  >
                    {LEAGUE_NAMES[league] || league.toUpperCase()}
                  </div>
                  <h1
                    style={{
                      fontFamily: "var(--font-anton), Anton, sans-serif",
                      fontSize: "36px",
                      marginBottom: "5px",
                    }}
                  >
                    {team.city ? `${team.city} ` : ""}
                    {team.name}
                  </h1>
                  {(team.conference || team.division) && (
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>
                      {[team.conference, team.division].filter(Boolean).join(" • ")}
                    </p>
                  )}
                </div>
                {stats && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "15px 25px",
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: "8px",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "var(--font-anton), Anton, sans-serif",
                        fontSize: "32px",
                      }}
                    >
                      {stats.wins}-{stats.losses}
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>
                      {stats.winPct}% WIN
                    </p>
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div
                style={{
                  display: "flex",
                  gap: "5px",
                  marginBottom: "20px",
                  borderBottom: "2px solid rgba(255,255,255,0.1)",
                  paddingBottom: "0",
                }}
              >
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: "12px 24px",
                      background: "transparent",
                      border: "none",
                      borderBottom:
                        activeTab === tab.id
                          ? "3px solid var(--orange)"
                          : "3px solid transparent",
                      color:
                        activeTab === tab.id
                          ? "var(--white)"
                          : "rgba(255,255,255,0.5)",
                      fontFamily: "var(--font-barlow), sans-serif",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: "pointer",
                      marginBottom: "-2px",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === "overview" && (
                <div className="section" style={{ padding: "30px" }}>
                  {league === "nba" && stats ? (
                    <>
                      <h2
                        style={{
                          fontFamily: "var(--font-anton), Anton, sans-serif",
                          fontSize: "24px",
                          marginBottom: "20px",
                        }}
                      >
                        Season Stats
                      </h2>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                          gap: "15px",
                          marginBottom: "30px",
                        }}
                      >
                        <StatBox label="PPG" value={stats.ppg.toFixed(1)} />
                        <StatBox label="OPP PPG" value={stats.oppPpg.toFixed(1)} />
                        <StatBox label="DIFF" value={(stats.ppg - stats.oppPpg).toFixed(1)} />
                        <StatBox label="WIN %" value={`${stats.winPct}%`} />
                      </div>

                      {stats.recentGames.length > 0 && (
                        <>
                          <h3
                            style={{
                              fontFamily: "var(--font-anton), Anton, sans-serif",
                              fontSize: "18px",
                              marginBottom: "15px",
                            }}
                          >
                            Recent Games
                          </h3>
                          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                            {stats.recentGames.map((game, i) => (
                              <div
                                key={i}
                                style={{
                                  padding: "10px 15px",
                                  background:
                                    game.result === "W"
                                      ? "rgba(76, 175, 80, 0.2)"
                                      : "rgba(244, 67, 54, 0.2)",
                                  borderRadius: "8px",
                                  textAlign: "center",
                                }}
                              >
                                <p
                                  style={{
                                    fontWeight: "600",
                                    color:
                                      game.result === "W"
                                        ? "rgb(76, 175, 80)"
                                        : "rgb(244, 67, 54)",
                                  }}
                                >
                                  {game.result}
                                </p>
                                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
                                  vs {game.opponent}
                                </p>
                                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>
                                  {game.score}
                                </p>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <p style={{ color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
                      {league !== "nba"
                        ? "Stats are currently only available for NBA teams."
                        : "Loading stats..."}
                    </p>
                  )}
                </div>
              )}

              {activeTab === "roster" && (
                <div className="section" style={{ padding: "30px" }}>
                  {league === "nba" && roster.length > 0 ? (
                    <>
                      <h2
                        style={{
                          fontFamily: "var(--font-anton), Anton, sans-serif",
                          fontSize: "24px",
                          marginBottom: "20px",
                        }}
                      >
                        Team Roster ({roster.length} players)
                      </h2>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                          gap: "15px",
                        }}
                      >
                        {roster.map((player) => (
                          <div
                            key={player.id}
                            style={{
                              padding: "15px",
                              background: "rgba(255,255,255,0.05)",
                              borderRadius: "8px",
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                            }}
                          >
                            <div
                              style={{
                                width: "50px",
                                height: "50px",
                                borderRadius: "50%",
                                background: "rgba(255,255,255,0.1)",
                                overflow: "hidden",
                                flexShrink: 0,
                              }}
                            >
                              {player.headshotUrl && (
                                <Image
                                  src={player.headshotUrl}
                                  alt={player.name}
                                  width={50}
                                  height={50}
                                  style={{ objectFit: "cover" }}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              )}
                            </div>
                            <div>
                              <p
                                style={{
                                  fontWeight: "600",
                                  fontSize: "14px",
                                }}
                              >
                                {player.name}
                              </p>
                              <p
                                style={{
                                  fontSize: "12px",
                                  color: "rgba(255,255,255,0.5)",
                                }}
                              >
                                {player.position || "N/A"}
                                {player.jerseyNumber && ` • #${player.jerseyNumber}`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p style={{ color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
                      {league !== "nba"
                        ? "Roster is currently only available for NBA teams."
                        : roster.length === 0
                        ? "No roster data available."
                        : "Loading roster..."}
                    </p>
                  )}
                </div>
              )}

              {activeTab === "schedule" && (
                <div className="section" style={{ padding: "30px" }}>
                  {league === "nba" && games.length > 0 ? (
                    <>
                      <h2
                        style={{
                          fontFamily: "var(--font-anton), Anton, sans-serif",
                          fontSize: "24px",
                          marginBottom: "20px",
                        }}
                      >
                        Recent Games
                      </h2>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {games.slice(0, 15).map((game) => {
                          const isHome = game.homeTeam.id === teamId;
                          const teamScore = isHome ? game.homeScore : game.awayScore;
                          const oppScore = isHome ? game.awayScore : game.homeScore;
                          const opponent = isHome ? game.awayTeam : game.homeTeam;
                          const won = teamScore > oppScore;
                          const gameDate = new Date(game.gameDate);

                          return (
                            <div
                              key={game.id}
                              style={{
                                padding: "15px 20px",
                                background: "rgba(255,255,255,0.05)",
                                borderRadius: "8px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "15px",
                                flexWrap: "wrap",
                              }}
                            >
                              <div style={{ minWidth: "100px" }}>
                                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                                  {gameDate.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </p>
                                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
                                  {isHome ? "HOME" : "AWAY"}
                                </p>
                              </div>
                              <div style={{ flex: 1 }}>
                                <p style={{ fontWeight: "600" }}>
                                  {isHome ? "vs" : "@"} {opponent.city} {opponent.name}
                                </p>
                              </div>
                              {game.status === "final" && (
                                <div style={{ textAlign: "right" }}>
                                  <p
                                    style={{
                                      fontFamily: "var(--font-anton), Anton, sans-serif",
                                      fontSize: "18px",
                                      color: won ? "rgb(76, 175, 80)" : "rgb(244, 67, 54)",
                                    }}
                                  >
                                    {won ? "W" : "L"} {teamScore}-{oppScore}
                                  </p>
                                </div>
                              )}
                              {game.status === "scheduled" && (
                                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>
                                  Upcoming
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <p style={{ color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
                      {league !== "nba"
                        ? "Schedule is currently only available for NBA teams."
                        : games.length === 0
                        ? "No games found."
                        : "Loading schedule..."}
                    </p>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>
      </main>
      <Footer />
    </>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: "15px",
        background: "rgba(255,255,255,0.05)",
        borderRadius: "8px",
        textAlign: "center",
      }}
    >
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", marginBottom: "5px" }}>
        {label}
      </p>
      <p
        style={{
          fontFamily: "var(--font-anton), Anton, sans-serif",
          fontSize: "24px",
        }}
      >
        {value}
      </p>
    </div>
  );
}
