"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Header, Footer } from "@/components";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type League = "nba" | "wnba" | "ncaam" | "ncaaw";
type ConferenceView = "both" | "east" | "west";

interface StandingsTeam {
  id: string;
  name: string;
  abbreviation: string;
  logo: string;
  wins: number;
  losses: number;
  winPct: string;
  gamesBehind: string;
  streak: string;
  last10: string;
  home: string;
  road: string;
  confRecord: string;
  divRecord: string;
  ppg: number;
  oppPpg: number;
  diff: number;
  seed: number;
}

interface Conference {
  name: string;
  teams: StandingsTeam[];
}

interface StandingsResponse {
  success: boolean;
  league: string;
  conferences: Conference[];
  error?: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const leagues: { id: League; name: string }[] = [
  { id: "nba", name: "NBA" },
  { id: "wnba", name: "WNBA" },
  { id: "ncaam", name: "NCAA M" },
  { id: "ncaaw", name: "NCAA W" },
];

const conferenceViews: { id: ConferenceView; label: string }[] = [
  { id: "east", label: "EAST" },
  { id: "west", label: "WEST" },
  { id: "both", label: "BOTH" },
];

const STAT_COLUMNS = [
  { key: "wins", label: "W" },
  { key: "losses", label: "L" },
  { key: "winPct", label: "PCT" },
  { key: "gamesBehind", label: "GB" },
  { key: "streak", label: "STRK" },
  { key: "last10", label: "L10" },
  { key: "home", label: "HOME" },
  { key: "road", label: "AWAY" },
] as const;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function isEastern(name: string): boolean {
  return name.toLowerCase().includes("east");
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function TeamLogo({ team }: { team: StandingsTeam }) {
  return (
    <Image
      src={team.logo}
      alt={team.name}
      width={50}
      height={50}
      style={{ objectFit: "contain", flexShrink: 0 }}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.style.display = "none";
        if (target.parentElement) {
          target.parentElement.textContent = team.abbreviation;
        }
      }}
    />
  );
}

function ConferenceTable({
  conference,
  showTitle,
}: {
  conference: Conference;
  showTitle: boolean;
}) {
  return (
    <div style={{ marginBottom: "40px" }}>
      {showTitle && (
        <h2
          style={{
            fontFamily: "var(--font-anton), Anton, sans-serif",
            fontSize: "28px",
            letterSpacing: "2px",
            color: "var(--white)",
            marginBottom: "20px",
            textTransform: "uppercase",
          }}
        >
          {conference.name}
        </h2>
      )}

      <div
        style={{
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          borderRadius: "8px",
        }}
      >
        <table
          style={{
            width: "100%",
            minWidth: "850px",
            borderCollapse: "collapse",
            background: "var(--dark-gray)",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          {/* ---- Header ---- */}
          <thead>
            <tr>
              <th
                style={{
                  ...thBase,
                  width: "50px",
                  textAlign: "center",
                }}
              >
                #
              </th>
              <th style={{ ...thBase, textAlign: "left", minWidth: "220px" }}>
                TEAM
              </th>
              {STAT_COLUMNS.map((col) => (
                <th key={col.key} style={{ ...thBase, textAlign: "center" }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* ---- Body ---- */}
          <tbody>
            {conference.teams.map((team, idx) => {
              const seed = team.seed || idx + 1;
              const isPlayoffCutoff = seed === 6;
              const isPlayInCutoff = seed === 10;

              return (
                <tr key={team.id} style={{}}>
                  {/* Seed */}
                  <td
                    style={{
                      ...tdBase,
                      textAlign: "center",
                      fontFamily:
                        "var(--font-roboto-mono), monospace",
                      fontWeight: 700,
                      color:
                        seed <= 6
                          ? "var(--white)"
                          : seed <= 10
                            ? "rgba(255,255,255,0.7)"
                            : "rgba(255,255,255,0.4)",
                      borderBottom: isPlayoffCutoff
                        ? "3px solid var(--orange)"
                        : isPlayInCutoff
                          ? "2px dashed var(--orange)"
                          : "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    {seed}
                  </td>

                  {/* Team */}
                  <td
                    style={{
                      ...tdBase,
                      borderBottom: isPlayoffCutoff
                        ? "3px solid var(--orange)"
                        : isPlayInCutoff
                          ? "2px dashed var(--orange)"
                          : "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <TeamLogo team={team} />
                      </div>
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: "14px",
                          whiteSpace: "nowrap",
                          color: "var(--white)",
                        }}
                      >
                        {team.name}
                      </span>
                    </div>
                  </td>

                  {/* Stats */}
                  {STAT_COLUMNS.map((col) => {
                    const value = team[col.key as keyof StandingsTeam];
                    return (
                      <td
                        key={col.key}
                        style={{
                          ...tdBase,
                          textAlign: "center",
                          fontFamily:
                            "var(--font-roboto-mono), monospace",
                          fontSize: "14px",
                          color: "var(--white)",
                          borderBottom: isPlayoffCutoff
                            ? "3px solid var(--orange)"
                            : isPlayInCutoff
                              ? "2px dashed var(--orange)"
                              : "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        {value !== undefined && value !== null
                          ? String(value)
                          : "-"}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: "24px",
          marginTop: "12px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              display: "inline-block",
              width: "30px",
              height: "3px",
              background: "var(--orange)",
            }}
          ></span>
          <span
            style={{
              fontSize: "12px",
              color: "rgba(255,255,255,0.5)",
              fontFamily: "var(--font-roboto-mono), monospace",
            }}
          >
            Playoff cutoff
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              display: "inline-block",
              width: "30px",
              height: "0px",
              borderTop: "2px dashed var(--orange)",
            }}
          ></span>
          <span
            style={{
              fontSize: "12px",
              color: "rgba(255,255,255,0.5)",
              fontFamily: "var(--font-roboto-mono), monospace",
            }}
          >
            Play-in cutoff
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared cell styles                                                 */
/* ------------------------------------------------------------------ */

const thBase: React.CSSProperties = {
  padding: "14px 12px",
  fontFamily: "var(--font-anton), Anton, sans-serif",
  fontSize: "13px",
  letterSpacing: "1.5px",
  color: "var(--orange)",
  textTransform: "uppercase",
  borderBottom: "2px solid rgba(255,255,255,0.15)",
  whiteSpace: "nowrap",
  background: "rgba(0,0,0,0.3)",
  position: "sticky",
  top: 0,
};

const tdBase: React.CSSProperties = {
  padding: "12px 12px",
  borderBottom: "1px solid rgba(255,255,255,0.1)",
  whiteSpace: "nowrap",
};

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function StandingsPage() {
  const [selectedLeague, setSelectedLeague] = useState<League>("nba");
  const [confView, setConfView] = useState<ConferenceView>("both");
  const [data, setData] = useState<StandingsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStandings = useCallback(async (league: League) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/standings?league=${league}`);
      const json: StandingsResponse = await res.json();
      if (!json.success) {
        setError(json.error || "Failed to load standings.");
        setData(null);
      } else {
        setData(json);
      }
    } catch {
      setError("Network error. Please try again.");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStandings(selectedLeague);
  }, [selectedLeague, fetchStandings]);

  /* Determine which conferences to display */
  const visibleConferences: Conference[] = (() => {
    if (!data?.conferences) return [];
    if (confView === "both") return data.conferences;
    if (confView === "east") {
      return data.conferences.filter((c) => isEastern(c.name));
    }
    return data.conferences.filter((c) => !isEastern(c.name));
  })();

  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          {/* ---------- Page Title ---------- */}
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h1
              style={{
                fontFamily: "var(--font-anton), Anton, sans-serif",
                fontSize: "48px",
                letterSpacing: "3px",
                color: "var(--white)",
                margin: 0,
              }}
            >
              STANDINGS
              <span
                style={{
                  display: "block",
                  width: "100px",
                  height: "4px",
                  background: "var(--orange)",
                  margin: "15px auto 0",
                }}
              ></span>
            </h1>
            <p style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: "15px",
              maxWidth: "650px",
              margin: "16px auto 0",
              lineHeight: "1.5",
            }}>
              Current basketball standings for NBA, WNBA, and NCAA. View conference rankings, win-loss records, and the playoff race updated daily.
            </p>
          </div>

          {/* ---------- League Tabs ---------- */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "24px",
              flexWrap: "wrap",
            }}
          >
            {leagues.map((league) => (
              <button
                key={league.id}
                onClick={() => setSelectedLeague(league.id)}
                style={{
                  padding: "12px 24px",
                  background:
                    selectedLeague === league.id
                      ? "var(--orange)"
                      : "var(--dark-gray)",
                  border: "2px solid",
                  borderColor:
                    selectedLeague === league.id
                      ? "var(--orange)"
                      : "rgba(255,255,255,0.1)",
                  color: "var(--white)",
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: "16px",
                  fontWeight: 600,
                  letterSpacing: "1px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                {league.name}
              </button>
            ))}
          </div>

          {/* ---------- Conference Toggle ---------- */}
          <div
            style={{
              display: "flex",
              gap: "6px",
              marginBottom: "32px",
              background: "var(--dark-gray)",
              padding: "4px",
              borderRadius: "8px",
              width: "fit-content",
            }}
          >
            {conferenceViews.map((view) => (
              <button
                key={view.id}
                onClick={() => setConfView(view.id)}
                style={{
                  padding: "10px 20px",
                  background:
                    confView === view.id
                      ? "var(--orange)"
                      : "transparent",
                  border: "none",
                  borderRadius: "6px",
                  color: "var(--white)",
                  fontFamily: "var(--font-anton), Anton, sans-serif",
                  fontSize: "14px",
                  letterSpacing: "2px",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                }}
              >
                {view.label}
              </button>
            ))}
          </div>

          {/* ---------- Content ---------- */}
          {isLoading ? (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  border: "4px solid rgba(255,255,255,0.1)",
                  borderTop: "4px solid var(--orange)",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  margin: "0 auto 20px",
                }}
              />
              <p
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: "16px",
                  fontFamily: "var(--font-roboto-mono), monospace",
                }}
              >
                Loading standings...
              </p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <p
                style={{
                  color: "#ff4444",
                  fontSize: "18px",
                  marginBottom: "20px",
                }}
              >
                {error}
              </p>
              <button
                onClick={() => fetchStandings(selectedLeague)}
                style={{
                  padding: "12px 32px",
                  background: "var(--orange)",
                  border: "none",
                  color: "var(--white)",
                  fontFamily: "var(--font-anton), Anton, sans-serif",
                  fontSize: "16px",
                  letterSpacing: "1px",
                  cursor: "pointer",
                  transition: "opacity 0.2s",
                }}
              >
                RETRY
              </button>
            </div>
          ) : visibleConferences.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <p
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: "18px",
                }}
              >
                No standings data available for{" "}
                {leagues.find((l) => l.id === selectedLeague)?.name}.
              </p>
              <p
                style={{
                  color: "rgba(255,255,255,0.3)",
                  marginTop: "10px",
                }}
              >
                Check back when the season is underway.
              </p>
            </div>
          ) : (
            visibleConferences.map((conf) => (
              <ConferenceTable
                key={conf.name}
                conference={conf}
                showTitle={confView === "both"}
              />
            ))
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
