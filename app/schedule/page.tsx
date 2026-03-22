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
  homeScore: number | null;
  awayScore: number | null;
  status: "final" | "live" | "scheduled";
  quarter?: string;
  clock?: string;
  gameDate: string;
  broadcast?: string;
}

interface DayGames {
  date: string;
  games: Game[];
}

const LEAGUES: { id: League; label: string }[] = [
  { id: "nba", label: "NBA" },
  { id: "wnba", label: "WNBA" },
  { id: "ncaam", label: "NCAA M" },
  { id: "ncaaw", label: "NCAA W" },
];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  // Sunday = 0, Monday = 1, ...
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatWeekRange(monday: Date): string {
  const sunday = addDays(monday, 6);
  const mOpts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const sOpts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  return `${monday.toLocaleDateString("en-US", mOpts)} - ${sunday.toLocaleDateString("en-US", sOpts)}`;
}

function formatDayHeader(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTipoff(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "TBD";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function isCurrentWeek(monday: Date): boolean {
  const today = new Date();
  const currentMonday = getMonday(today);
  return formatDate(monday) === formatDate(currentMonday);
}

export default function SchedulePage() {
  const [league, setLeague] = useState<League>("nba");
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [weekData, setWeekData] = useState<DayGames[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWeek = useCallback(async () => {
    setLoading(true);
    try {
      const dates = Array.from({ length: 7 }, (_, i) => formatDate(addDays(weekStart, i)));
      const responses = await Promise.all(
        dates.map((date) =>
          fetch(`/api/games?league=${league}&date=${date}`)
            .then((r) => r.json())
            .then((data) => ({
              date,
              games: data.success ? (data.games as Game[]) : [],
            }))
            .catch(() => ({ date, games: [] as Game[] }))
        )
      );
      setWeekData(responses);
    } catch {
      setWeekData(
        Array.from({ length: 7 }, (_, i) => ({
          date: formatDate(addDays(weekStart, i)),
          games: [],
        }))
      );
    } finally {
      setLoading(false);
    }
  }, [weekStart, league]);

  useEffect(() => {
    fetchWeek();
  }, [fetchWeek]);

  const goToPrevWeek = () => setWeekStart((prev) => addDays(prev, -7));
  const goToNextWeek = () => setWeekStart((prev) => addDays(prev, 7));
  const goToThisWeek = () => setWeekStart(getMonday(new Date()));

  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>

          {/* Page Title */}
          <h1
            style={{
              fontFamily: "var(--font-anton), Anton, sans-serif",
              fontSize: "48px",
              marginBottom: "10px",
              textAlign: "center",
            }}
          >
            SCHEDULE
            <span
              style={{
                display: "block",
                width: "100px",
                height: "4px",
                background: "var(--orange)",
                margin: "15px auto 0",
              }}
            />
          </h1>

          {/* League Tabs */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "8px",
              marginTop: "30px",
              marginBottom: "30px",
              flexWrap: "wrap",
            }}
          >
            {LEAGUES.map((l) => (
              <button
                key={l.id}
                onClick={() => setLeague(l.id)}
                style={{
                  padding: "10px 28px",
                  fontFamily: "var(--font-anton), Anton, sans-serif",
                  fontSize: "16px",
                  letterSpacing: "2px",
                  background: league === l.id ? "var(--orange)" : "var(--dark-gray)",
                  color: "var(--white)",
                  border: league === l.id ? "1px solid var(--orange)" : "1px solid rgba(255,255,255,0.1)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Week Navigation */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "16px",
              marginBottom: "30px",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={goToPrevWeek}
              style={{
                padding: "10px 20px",
                background: "var(--dark-gray)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--white)",
                fontFamily: "var(--font-anton), Anton, sans-serif",
                fontSize: "14px",
                letterSpacing: "1px",
                cursor: "pointer",
                transition: "border-color 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = "var(--orange)")}
              onMouseOut={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
            >
              &#9664; PREV WEEK
            </button>

            <span
              style={{
                fontFamily: "var(--font-roboto-mono), monospace",
                fontSize: "16px",
                color: "var(--white)",
                letterSpacing: "1px",
                minWidth: "240px",
                textAlign: "center",
              }}
            >
              {formatWeekRange(weekStart)}
            </span>

            <button
              onClick={goToNextWeek}
              style={{
                padding: "10px 20px",
                background: "var(--dark-gray)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--white)",
                fontFamily: "var(--font-anton), Anton, sans-serif",
                fontSize: "14px",
                letterSpacing: "1px",
                cursor: "pointer",
                transition: "border-color 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = "var(--orange)")}
              onMouseOut={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
            >
              NEXT WEEK &#9654;
            </button>

            {!isCurrentWeek(weekStart) && (
              <button
                onClick={goToThisWeek}
                style={{
                  padding: "10px 20px",
                  background: "transparent",
                  border: "1px solid var(--orange)",
                  color: "var(--orange)",
                  fontFamily: "var(--font-anton), Anton, sans-serif",
                  fontSize: "14px",
                  letterSpacing: "1px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "var(--orange)";
                  e.currentTarget.style.color = "var(--white)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--orange)";
                }}
              >
                THIS WEEK
              </button>
            )}
          </div>

          {/* Loading State */}
          {loading ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: "12px",
              }}
            >
              {Array.from({ length: 7 }, (_, i) => (
                <div
                  key={i}
                  style={{
                    background: "var(--dark-gray)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    minHeight: "300px",
                    opacity: 0.5,
                  }}
                >
                  <div
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid rgba(255,255,255,0.1)",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        height: "16px",
                        width: "60px",
                        background: "rgba(255,255,255,0.1)",
                        margin: "0 auto 6px",
                      }}
                    />
                    <div
                      style={{
                        height: "12px",
                        width: "80px",
                        background: "rgba(255,255,255,0.06)",
                        margin: "0 auto",
                      }}
                    />
                  </div>
                  <div style={{ padding: "12px" }}>
                    {[1, 2].map((j) => (
                      <div
                        key={j}
                        style={{
                          height: "50px",
                          background: "rgba(255,255,255,0.05)",
                          marginBottom: "8px",
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Desktop: 7-column grid */}
              <div
                className="schedule-desktop"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: "12px",
                }}
              >
                {weekData.map((day, idx) => {
                  const dateObj = addDays(weekStart, idx);
                  const isToday = formatDate(dateObj) === formatDate(new Date());
                  return (
                    <div
                      key={day.date}
                      style={{
                        background: "var(--dark-gray)",
                        border: isToday
                          ? "1px solid var(--orange)"
                          : "1px solid rgba(255,255,255,0.1)",
                        minHeight: "280px",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {/* Day Header */}
                      <div
                        style={{
                          padding: "12px 10px",
                          borderBottom: "1px solid rgba(255,255,255,0.1)",
                          textAlign: "center",
                          background: isToday
                            ? "rgba(255,107,53,0.15)"
                            : "rgba(255,255,255,0.02)",
                        }}
                      >
                        <div
                          style={{
                            fontFamily: "var(--font-anton), Anton, sans-serif",
                            fontSize: "14px",
                            letterSpacing: "2px",
                            color: isToday ? "var(--orange)" : "var(--white)",
                          }}
                        >
                          {DAY_LABELS[idx]}
                        </div>
                        <div
                          style={{
                            fontFamily: "var(--font-roboto-mono), monospace",
                            fontSize: "12px",
                            color: "rgba(255,255,255,0.5)",
                            marginTop: "2px",
                          }}
                        >
                          {formatDayHeader(dateObj)}
                        </div>
                      </div>

                      {/* Games List */}
                      <div style={{ padding: "8px", flex: 1 }}>
                        {day.games.length === 0 ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              height: "100%",
                              minHeight: "80px",
                              color: "rgba(255,255,255,0.2)",
                              fontSize: "12px",
                              fontFamily: "var(--font-roboto-mono), monospace",
                            }}
                          >
                            No games
                          </div>
                        ) : (
                          day.games.map((game) => (
                            <GameSlot key={game.id} game={game} league={league} />
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mobile: stacked vertical */}
              <div className="schedule-mobile" style={{ display: "none" }}>
                {weekData.map((day, idx) => {
                  const dateObj = addDays(weekStart, idx);
                  const isToday = formatDate(dateObj) === formatDate(new Date());
                  return (
                    <div
                      key={day.date}
                      style={{
                        background: "var(--dark-gray)",
                        border: isToday
                          ? "1px solid var(--orange)"
                          : "1px solid rgba(255,255,255,0.1)",
                        marginBottom: "16px",
                      }}
                    >
                      {/* Day Header */}
                      <div
                        style={{
                          padding: "14px 16px",
                          borderBottom: "1px solid rgba(255,255,255,0.1)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          background: isToday
                            ? "rgba(255,107,53,0.15)"
                            : "rgba(255,255,255,0.02)",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-anton), Anton, sans-serif",
                            fontSize: "16px",
                            letterSpacing: "2px",
                            color: isToday ? "var(--orange)" : "var(--white)",
                          }}
                        >
                          {DAY_LABELS[idx]}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-roboto-mono), monospace",
                            fontSize: "13px",
                            color: "rgba(255,255,255,0.5)",
                          }}
                        >
                          {formatDayHeader(dateObj)}
                        </span>
                      </div>

                      {/* Games */}
                      <div style={{ padding: "8px" }}>
                        {day.games.length === 0 ? (
                          <div
                            style={{
                              padding: "20px",
                              textAlign: "center",
                              color: "rgba(255,255,255,0.2)",
                              fontSize: "13px",
                              fontFamily: "var(--font-roboto-mono), monospace",
                            }}
                          >
                            No games scheduled
                          </div>
                        ) : (
                          day.games.map((game) => (
                            <GameSlot key={game.id} game={game} league={league} />
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Responsive CSS */}
          <style>{`
            @media (max-width: 900px) {
              .schedule-desktop { display: none !important; }
              .schedule-mobile { display: block !important; }
            }
          `}</style>
        </div>
      </main>
      <Footer />
    </>
  );
}

/* -------------------------------------------------------- */
/* Individual game slot inside a day column                  */
/* -------------------------------------------------------- */
function GameSlot({ game, league }: { game: Game; league: string }) {
  const isFinal = game.status === "final";
  const isLive = game.status === "live";

  return (
    <Link
      href={`/game/${game.id}?league=${league}`}
      style={{
        display: "block",
        textDecoration: "none",
        color: "inherit",
        padding: "8px",
        marginBottom: "6px",
        background: "rgba(255,255,255,0.03)",
        border: isLive
          ? "1px solid rgba(255,107,53,0.4)"
          : "1px solid rgba(255,255,255,0.06)",
        transition: "all 0.2s ease",
        cursor: "pointer",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.07)";
        e.currentTarget.style.borderColor = "var(--orange)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.03)";
        e.currentTarget.style.borderColor = isLive
          ? "rgba(255,107,53,0.4)"
          : "rgba(255,255,255,0.06)";
      }}
    >
      {/* Matchup Row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          marginBottom: "4px",
        }}
      >
        {/* Away Team */}
        {game.awayTeam.logoUrl && (
          <Image
            src={game.awayTeam.logoUrl}
            alt={game.awayTeam.abbreviation}
            width={24}
            height={24}
            style={{ objectFit: "contain", flexShrink: 0 }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}
        <span
          style={{
            fontFamily: "var(--font-anton), Anton, sans-serif",
            fontSize: "13px",
            letterSpacing: "1px",
            color: "var(--white)",
          }}
        >
          {game.awayTeam.abbreviation}
        </span>

        <span
          style={{
            color: "rgba(255,255,255,0.3)",
            fontSize: "11px",
            margin: "0 2px",
          }}
        >
          @
        </span>

        {/* Home Team */}
        {game.homeTeam.logoUrl && (
          <Image
            src={game.homeTeam.logoUrl}
            alt={game.homeTeam.abbreviation}
            width={24}
            height={24}
            style={{ objectFit: "contain", flexShrink: 0 }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}
        <span
          style={{
            fontFamily: "var(--font-anton), Anton, sans-serif",
            fontSize: "13px",
            letterSpacing: "1px",
            color: "var(--white)",
          }}
        >
          {game.homeTeam.abbreviation}
        </span>
      </div>

      {/* Score / Time Row */}
      <div
        style={{
          fontFamily: "var(--font-roboto-mono), monospace",
          fontSize: "12px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        {isFinal && (
          <>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px" }}>
              FINAL
            </span>
            <span style={{ color: "var(--white)" }}>
              {game.awayScore} - {game.homeScore}
            </span>
          </>
        )}
        {isLive && (
          <>
            <span
              style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "var(--orange)",
                animation: "pulse 1.5s ease-in-out infinite",
                flexShrink: 0,
              }}
            />
            <span style={{ color: "var(--orange)", fontWeight: "bold" }}>
              {game.awayScore} - {game.homeScore}
            </span>
            {game.quarter && (
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px" }}>
                {game.quarter} {game.clock || ""}
              </span>
            )}
          </>
        )}
        {game.status === "scheduled" && (
          <span style={{ color: "rgba(255,255,255,0.5)" }}>
            {formatTipoff(game.gameDate)}
          </span>
        )}
      </div>

      {/* Broadcast Info */}
      {game.broadcast && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          marginTop: "4px",
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
            <polyline points="17 2 12 7 7 2" />
          </svg>
          <span style={{
            fontFamily: "var(--font-roboto-mono), monospace",
            fontSize: "10px",
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.3px",
          }}>
            {game.broadcast}
          </span>
        </div>
      )}

      {/* Pulse animation for live dot */}
      {isLive && (
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}</style>
      )}
    </Link>
  );
}
