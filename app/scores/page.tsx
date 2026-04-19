"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Header, Footer } from "@/components";

type League = "nba" | "wnba" | "ncaam" | "ncaaw";

interface GameTeam {
  id: string;
  name: string;
  abbreviation: string;
  logoUrl: string;
}

interface Game {
  id: string;
  homeTeam: GameTeam;
  awayTeam: GameTeam;
  homeScore: number;
  awayScore: number;
  status: "final" | "live" | "scheduled";
  quarter?: string;
  clock?: string;
  gameDate: string;
  broadcast?: string;
}

const leagueTabs: { id: League; name: string }[] = [
  { id: "nba", name: "NBA" },
  { id: "wnba", name: "WNBA" },
  { id: "ncaam", name: "NCAA M" },
  { id: "ncaaw", name: "NCAA W" },
];

function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function TeamLogo({ team }: { team: GameTeam }) {
  if (team.logoUrl) {
    return (
      <div style={{
        width: "40px",
        height: "40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        flexShrink: 0,
      }}>
        <Image
          src={team.logoUrl}
          alt={team.name}
          width={40}
          height={40}
          style={{ objectFit: "contain" }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            if (target.parentElement) {
              target.parentElement.textContent = team.abbreviation;
              target.parentElement.style.fontFamily = "var(--font-anton), Anton, sans-serif";
              target.parentElement.style.fontSize = "14px";
              target.parentElement.style.color = "var(--white)";
            }
          }}
        />
      </div>
    );
  }
  return (
    <div style={{
      width: "40px",
      height: "40px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-anton), Anton, sans-serif",
      fontSize: "14px",
      color: "var(--white)",
      background: "var(--border-color)",
      borderRadius: "4px",
      flexShrink: 0,
    }}>
      {team.abbreviation}
    </div>
  );
}

function GameCard({ game, league }: { game: Game; league: string }) {
  const isLive = game.status === "live";
  const isFinal = game.status === "final";
  const isScheduled = game.status === "scheduled";

  const homeWon = isFinal && game.homeScore > game.awayScore;
  const awayWon = isFinal && game.awayScore > game.homeScore;

  const tipOffTime = isScheduled
    ? new Date(game.gameDate).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <Link
      href={`/game/${game.id}?league=${league}`}
      style={{
        textDecoration: "none",
        color: "inherit",
        display: "block",
      }}
    >
      <div style={{
        background: "var(--dark-gray)",
        border: isLive
          ? "2px solid var(--orange)"
          : "1px solid var(--border-color)",
        borderRadius: "8px",
        padding: "20px",
        cursor: "pointer",
        transition: "transform 0.2s ease, border-color 0.2s ease",
        position: "relative",
      }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
          (e.currentTarget as HTMLDivElement).style.borderColor = "var(--orange)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
          (e.currentTarget as HTMLDivElement).style.borderColor = isLive
            ? "var(--orange)"
            : "var(--border-color)";
        }}
      >
        {/* Status badge */}
        <div style={{
          textAlign: "center",
          marginBottom: "12px",
          fontSize: "12px",
          fontFamily: "var(--font-roboto-mono), monospace",
          fontWeight: "bold",
          letterSpacing: "1px",
        }}>
          {isLive && (
            <span style={{
              color: "var(--orange)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}>
              <span style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "var(--orange)",
                display: "inline-block",
                animation: "pulse 1.5s ease-in-out infinite",
              }}></span>
              {game.quarter} {game.clock}
            </span>
          )}
          {isFinal && (
            <span style={{ color: "var(--text-muted)" }}>FINAL</span>
          )}
          {isScheduled && (
            <span style={{ color: "var(--text-muted)" }}>{tipOffTime}</span>
          )}
        </div>

        {/* Away Team Row */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "10px",
          padding: "8px 0",
        }}>
          <TeamLogo team={game.awayTeam} />
          <span style={{
            fontFamily: "var(--font-anton), Anton, sans-serif",
            fontSize: "16px",
            color: awayWon ? "var(--orange)" : "var(--white)",
            flex: 1,
            fontWeight: awayWon ? "bold" : "normal",
          }}>
            {game.awayTeam.abbreviation}
          </span>
          <span style={{
            fontFamily: "var(--font-roboto-mono), monospace",
            fontSize: "24px",
            fontWeight: "bold",
            color: awayWon ? "var(--orange)" : "var(--white)",
            minWidth: "50px",
            textAlign: "right",
          }}>
            {isScheduled ? "-" : game.awayScore}
          </span>
        </div>

        {/* Home Team Row */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "8px 0",
        }}>
          <TeamLogo team={game.homeTeam} />
          <span style={{
            fontFamily: "var(--font-anton), Anton, sans-serif",
            fontSize: "16px",
            color: homeWon ? "var(--orange)" : "var(--white)",
            flex: 1,
            fontWeight: homeWon ? "bold" : "normal",
          }}>
            {game.homeTeam.abbreviation}
          </span>
          <span style={{
            fontFamily: "var(--font-roboto-mono), monospace",
            fontSize: "24px",
            fontWeight: "bold",
            color: homeWon ? "var(--orange)" : "var(--white)",
            minWidth: "50px",
            textAlign: "right",
          }}>
            {isScheduled ? "-" : game.homeScore}
          </span>
        </div>

        {/* Broadcast Info */}
        {game.broadcast && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginTop: "8px",
            paddingTop: "8px",
            borderTop: "1px solid var(--border-subtle)",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
              <polyline points="17 2 12 7 7 2" />
            </svg>
            <span style={{
              fontFamily: "var(--font-roboto-mono), monospace",
              fontSize: "11px",
              color: "var(--text-faint)",
              letterSpacing: "0.5px",
            }}>
              {game.broadcast}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

export default function ScoresPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedLeague, setSelectedLeague] = useState<League>("nba");
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const dateParam = formatDateParam(selectedDate);
      const res = await fetch(
        `/api/games?league=${selectedLeague}&date=${dateParam}`
      );
      const data = await res.json();
      if (data.success) {
        setGames(data.games || []);
      } else {
        setError(data.error || "Failed to load games");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, selectedLeague]);

  useEffect(() => {
    fetchGames();
    // Auto-refresh every 30 seconds for live games
    const interval = setInterval(fetchGames, 30000);
    return () => clearInterval(interval);
  }, [fetchGames]);

  const goToPreviousDay = () => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 1);
      return d;
    });
  };

  const goToNextDay = () => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 1);
      return d;
    });
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const isToday = isSameDay(selectedDate, new Date());

  const liveGames = games.filter((g) => g.status === "live");
  const finalGames = games.filter((g) => g.status === "final");
  const scheduledGames = games.filter((g) => g.status === "scheduled");

  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {/* Page Title */}
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h1 style={{
              fontFamily: "var(--font-anton), Anton, sans-serif",
              fontSize: "48px",
              margin: 0,
              color: "var(--white)",
            }}>
              SCORES
              <span style={{
                display: "block",
                width: "100px",
                height: "4px",
                background: "var(--orange)",
                margin: "15px auto 0",
              }}></span>
            </h1>
            <p style={{
              color: "var(--text-muted)",
              fontSize: "15px",
              maxWidth: "650px",
              margin: "16px auto 0",
              lineHeight: "1.5",
            }}>
              Live basketball scores updated in real-time. Track NBA, WNBA, and NCAA games with box scores and final results.
            </p>
          </div>

          {/* Date Navigation Bar */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            marginBottom: "30px",
            flexWrap: "wrap",
          }}>
            <button
              onClick={goToPreviousDay}
              style={{
                background: "var(--dark-gray)",
                border: "1px solid var(--border-color)",
                color: "var(--white)",
                fontSize: "24px",
                width: "48px",
                height: "48px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "4px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--orange)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-color)";
              }}
              aria-label="Previous day"
            >
              &#9664;
            </button>

            <span style={{
              fontFamily: "var(--font-anton), Anton, sans-serif",
              fontSize: "20px",
              color: "var(--white)",
              minWidth: "280px",
              textAlign: "center",
              letterSpacing: "1px",
            }}>
              {formatDateDisplay(selectedDate)}
            </span>

            <button
              onClick={goToNextDay}
              style={{
                background: "var(--dark-gray)",
                border: "1px solid var(--border-color)",
                color: "var(--white)",
                fontSize: "24px",
                width: "48px",
                height: "48px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "4px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--orange)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-color)";
              }}
              aria-label="Next day"
            >
              &#9654;
            </button>

            <button
              onClick={goToToday}
              style={{
                background: isToday ? "var(--orange)" : "var(--dark-gray)",
                border: "2px solid",
                borderColor: isToday ? "var(--orange)" : "var(--border-color)",
                color: "var(--white)",
                fontFamily: "var(--font-anton), Anton, sans-serif",
                fontSize: "14px",
                letterSpacing: "2px",
                padding: "12px 24px",
                cursor: "pointer",
                borderRadius: "4px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!isToday) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--orange)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isToday) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-color)";
                }
              }}
            >
              TODAY
            </button>
          </div>

          {/* League Tabs */}
          <div style={{
            display: "flex",
            gap: "10px",
            marginBottom: "40px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}>
            {leagueTabs.map((league) => (
              <button
                key={league.id}
                onClick={() => setSelectedLeague(league.id)}
                style={{
                  padding: "12px 24px",
                  background: selectedLeague === league.id ? "var(--orange)" : "var(--dark-gray)",
                  border: "2px solid",
                  borderColor: selectedLeague === league.id ? "var(--orange)" : "var(--border-color)",
                  color: "var(--white)",
                  fontFamily: "var(--font-anton), Anton, sans-serif",
                  fontSize: "16px",
                  letterSpacing: "1px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  borderRadius: "4px",
                }}
              >
                {league.name}
              </button>
            ))}
          </div>

          {/* Content */}
          {isLoading ? (
            <div style={{
              textAlign: "center",
              padding: "80px 20px",
            }}>
              <div style={{
                width: "48px",
                height: "48px",
                border: "4px solid var(--border-color)",
                borderTop: "4px solid var(--orange)",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 20px",
              }}></div>
              <p style={{
                color: "var(--text-muted)",
                fontFamily: "var(--font-roboto-mono), monospace",
                fontSize: "14px",
              }}>
                Loading games...
              </p>
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : error ? (
            <div style={{
              textAlign: "center",
              padding: "80px 20px",
            }}>
              <p style={{ color: "var(--red)", fontSize: "16px", marginBottom: "20px" }}>
                {error}
              </p>
              <button
                onClick={fetchGames}
                style={{
                  padding: "12px 32px",
                  background: "var(--orange)",
                  border: "none",
                  color: "var(--white)",
                  fontFamily: "var(--font-anton), Anton, sans-serif",
                  fontSize: "16px",
                  cursor: "pointer",
                  borderRadius: "4px",
                }}
              >
                RETRY
              </button>
            </div>
          ) : games.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "80px 20px",
            }}>
              <p style={{
                color: "var(--text-muted)",
                fontSize: "20px",
                fontFamily: "var(--font-anton), Anton, sans-serif",
                letterSpacing: "1px",
              }}>
                No games scheduled for this date
              </p>
              <p style={{
                color: "var(--text-faint)",
                marginTop: "12px",
                fontSize: "14px",
              }}>
                Try navigating to another date or selecting a different league.
              </p>
            </div>
          ) : (
            <>
              {/* LIVE Games */}
              {liveGames.length > 0 && (
                <section style={{ marginBottom: "50px" }}>
                  <h2 style={{
                    fontFamily: "var(--font-anton), Anton, sans-serif",
                    fontSize: "28px",
                    marginBottom: "24px",
                    color: "var(--orange)",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}>
                    <span style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: "var(--orange)",
                      display: "inline-block",
                      animation: "pulse 1.5s ease-in-out infinite",
                    }}></span>
                    LIVE ({liveGames.length})
                  </h2>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "16px",
                  }}>
                    {liveGames.map((game) => (
                      <GameCard key={game.id} game={game} league={selectedLeague} />
                    ))}
                  </div>
                </section>
              )}

              {/* FINAL Games */}
              {finalGames.length > 0 && (
                <section style={{ marginBottom: "50px" }}>
                  <h2 style={{
                    fontFamily: "var(--font-anton), Anton, sans-serif",
                    fontSize: "28px",
                    marginBottom: "24px",
                    color: "var(--white)",
                  }}>
                    FINAL ({finalGames.length})
                  </h2>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "16px",
                  }}>
                    {finalGames.map((game) => (
                      <GameCard key={game.id} game={game} league={selectedLeague} />
                    ))}
                  </div>
                </section>
              )}

              {/* UPCOMING Games */}
              {scheduledGames.length > 0 && (
                <section style={{ marginBottom: "50px" }}>
                  <h2 style={{
                    fontFamily: "var(--font-anton), Anton, sans-serif",
                    fontSize: "28px",
                    marginBottom: "24px",
                    color: "var(--text-muted)",
                  }}>
                    UPCOMING ({scheduledGames.length})
                  </h2>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "16px",
                  }}>
                    {scheduledGames.map((game) => (
                      <GameCard key={game.id} game={game} league={selectedLeague} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        {/* Keyframe animations */}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}</style>
      </main>
      <Footer />
    </>
  );
}
