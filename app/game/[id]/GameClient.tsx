"use client";

import { useState, useEffect, use, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Header, Footer } from "@/components";

// NBA team primary colors by abbreviation
const NBA_TEAM_COLORS: Record<string, string> = {
  ATL: "#E03A3E", BOS: "#007A33", BKN: "#000000", CHA: "#1D1160",
  CHI: "#CE1141", CLE: "#860038", DAL: "#00538C", DEN: "#0E2240",
  DET: "#C8102E", GS: "#1D428A", GSW: "#1D428A", HOU: "#CE1141",
  IND: "#002D62", LAC: "#C8102E", LAL: "#552583", MEM: "#5D76A9",
  MIA: "#98002E", MIL: "#00471B", MIN: "#0C2340", NO: "#0C2340",
  NOP: "#0C2340", NY: "#006BB6", NYK: "#006BB6", OKC: "#007AC1",
  ORL: "#0077C0", PHI: "#006BB6", PHX: "#1D1160", POR: "#E03A3E",
  SAC: "#5A2D81", SA: "#C4CED4", SAS: "#C4CED4", TOR: "#CE1141",
  UTA: "#002B5C", UTAH: "#002B5C", WAS: "#002B4C", WSH: "#002B4C",
};

function getTeamColor(abbr: string, fallback: string): string {
  return NBA_TEAM_COLORS[abbr.toUpperCase()] || fallback;
}


function TeamLogo({ logo, name, abbreviation }: { logo?: string; name: string; abbreviation: string }) {
  const [imageError, setImageError] = useState(false);

  if (!logo || imageError) {
    return (
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
        {abbreviation}
      </div>
    );
  }

  return (
    <Image
      src={logo}
      alt={name}
      width={100}
      height={100}
      style={{ objectFit: "contain", marginBottom: "15px" }}
      unoptimized
      onError={() => setImageError(true)}
    />
  );
}

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
  broadcast?: string;
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
  linescores?: {
    home: string[];
    away: string[];
  };
  records?: {
    home: string | null;
    away: string | null;
  };
  odds?: {
    spread: number | null;
    overUnder: number | null;
    homeMoneyline: number | null;
    awayMoneyline: number | null;
    details: string | null;
    provider: string | null;
  } | null;
  seasonSeries?: string | null;
  analytics?: {
    winProbability: { home: number; away: number };
    momentum?: { score: number; label: string; factors: string[] } | null;
    insights: string[];
  };
}

// ─── Win Probability Bar ─────────────────────────────────────────

function WinProbabilityBar({
  home, away, homeAbbr, awayAbbr, isLive,
}: {
  home: number; away: number; homeAbbr: string; awayAbbr: string; isLive: boolean;
}) {
  return (
    <div style={{
      background: "var(--dark-gray)",
      padding: "20px 30px",
      marginBottom: "20px",
      border: isLive ? "1px solid rgba(255, 107, 53, 0.3)" : "1px solid rgba(255,255,255,0.05)",
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "12px",
      }}>
        <span style={{ fontSize: "12px", letterSpacing: "1px", color: "rgba(255,255,255,0.5)" }}>
          WIN PROBABILITY
        </span>
        {isLive && (
          <span style={{
            fontSize: "10px",
            letterSpacing: "1px",
            color: "var(--orange)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}>
            <span style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "var(--orange)",
              animation: "pulse 2s ease-in-out infinite",
            }} />
            LIVE
          </span>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
          <span style={{
            fontFamily: "var(--font-roboto-mono), monospace",
            fontSize: "24px",
            fontWeight: "bold",
            color: "var(--blue)",
          }}>
            {away}%
          </span>
          <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)" }}>{awayAbbr}</span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
          <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)" }}>{homeAbbr}</span>
          <span style={{
            fontFamily: "var(--font-roboto-mono), monospace",
            fontSize: "24px",
            fontWeight: "bold",
            color: "var(--orange)",
          }}>
            {home}%
          </span>
        </div>
      </div>
      <div style={{
        display: "flex",
        height: "10px",
        borderRadius: "5px",
        overflow: "hidden",
        background: "rgba(255,255,255,0.05)",
      }}>
        <div style={{
          width: `${away}%`,
          background: "var(--blue)",
          transition: "width 0.5s ease",
        }} />
        <div style={{
          width: `${home}%`,
          background: "var(--orange)",
          transition: "width 0.5s ease",
        }} />
      </div>
    </div>
  );
}

// ─── Quarter Scores Table ────────────────────────────────────────

function QuarterScoresTable({
  homeLinescores, awayLinescores, homeAbbr, awayAbbr,
  homeScore, awayScore, period, isLive,
}: {
  homeLinescores: string[];
  awayLinescores: string[];
  homeAbbr: string;
  awayAbbr: string;
  homeScore: number;
  awayScore: number;
  period: number;
  isLive: boolean;
}) {
  const maxQuarters = Math.max(homeLinescores.length, awayLinescores.length, 4);
  const headers: string[] = [];
  for (let i = 0; i < maxQuarters; i++) {
    headers.push(i < 4 ? `Q${i + 1}` : `OT${i - 3}`);
  }

  const cellStyle = (isCurrentQ: boolean): React.CSSProperties => ({
    padding: "10px 14px",
    textAlign: "center",
    fontFamily: "var(--font-roboto-mono), monospace",
    fontSize: "14px",
    background: isCurrentQ && isLive ? "rgba(255, 107, 53, 0.15)" : "transparent",
  });

  return (
    <div style={{
      background: "var(--dark-gray)",
      marginBottom: "20px",
      overflowX: "auto",
    }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "400px" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <th style={{ padding: "10px 14px", textAlign: "left", fontSize: "12px", fontWeight: 600, width: "100px" }}>TEAM</th>
            {headers.map((h, i) => (
              <th key={h} style={{
                ...cellStyle(i + 1 === period && isLive),
                fontSize: "12px",
                fontWeight: 600,
                color: "rgba(255,255,255,0.5)",
              }}>
                {h}
              </th>
            ))}
            <th style={{ padding: "10px 14px", textAlign: "center", fontSize: "12px", fontWeight: 700 }}>T</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <td style={{ padding: "10px 14px", fontWeight: 600, fontSize: "14px" }}>{awayAbbr}</td>
            {headers.map((_, i) => (
              <td key={i} style={cellStyle(i + 1 === period && isLive)}>
                {awayLinescores[i] || "-"}
              </td>
            ))}
            <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700, fontFamily: "var(--font-roboto-mono), monospace" }}>
              {awayScore}
            </td>
          </tr>
          <tr>
            <td style={{ padding: "10px 14px", fontWeight: 600, fontSize: "14px" }}>{homeAbbr}</td>
            {headers.map((_, i) => (
              <td key={i} style={cellStyle(i + 1 === period && isLive)}>
                {homeLinescores[i] || "-"}
              </td>
            ))}
            <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700, fontFamily: "var(--font-roboto-mono), monospace" }}>
              {homeScore}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── Quarter Scores Bar Chart ────────────────────────────────────

function QuarterScoresChart({
  homeLinescores, awayLinescores, homeAbbr, awayAbbr,
}: {
  homeLinescores: string[];
  awayLinescores: string[];
  homeAbbr: string;
  awayAbbr: string;
}) {
  const quarters = Math.max(homeLinescores.length, awayLinescores.length);
  if (quarters === 0) return null;

  const homeNums = homeLinescores.map(s => parseInt(s) || 0);
  const awayNums = awayLinescores.map(s => parseInt(s) || 0);
  const maxVal = Math.max(...homeNums, ...awayNums, 1);

  const labels: string[] = [];
  for (let i = 0; i < quarters; i++) {
    labels.push(i < 4 ? `Q${i + 1}` : `OT${i - 3}`);
  }

  const awayColor = getTeamColor(awayAbbr, "#3B82F6");
  const homeColor = getTeamColor(homeAbbr, "#FF6B35");

  const chartHeight = 160;
  const barMaxHeight = chartHeight - 30;

  return (
    <div style={{
      background: "var(--dark-gray)",
      padding: "20px 30px",
      marginBottom: "20px",
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px",
      }}>
        <span style={{ fontSize: "12px", letterSpacing: "1px", color: "rgba(255,255,255,0.5)" }}>
          SCORING BY QUARTER
        </span>
        <div style={{ display: "flex", gap: "16px", fontSize: "12px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "10px", height: "10px", background: awayColor, display: "inline-block" }} />
            {awayAbbr}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "10px", height: "10px", background: homeColor, display: "inline-block" }} />
            {homeAbbr}
          </span>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: "8px", height: `${chartHeight}px`, alignItems: "flex-end" }}>
        {labels.map((label, i) => {
          const awayH = awayNums[i] ? (awayNums[i] / maxVal) * barMaxHeight : 0;
          const homeH = homeNums[i] ? (homeNums[i] / maxVal) * barMaxHeight : 0;

          return (
            <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, maxWidth: "100px" }}>
              <div style={{ display: "flex", gap: "4px", alignItems: "flex-end", height: `${barMaxHeight}px` }}>
                {/* Away bar */}
                <div style={{ position: "relative", width: "28px" }}>
                  {awayNums[i] > 0 && (
                    <span style={{
                      position: "absolute",
                      top: "-18px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      fontSize: "11px",
                      fontFamily: "var(--font-roboto-mono), monospace",
                      color: awayColor,
                      fontWeight: 600,
                    }}>
                      {awayNums[i]}
                    </span>
                  )}
                  <div style={{
                    width: "28px",
                    height: `${awayH}px`,
                    background: awayColor,
                    borderRadius: "3px 3px 0 0",
                    transition: "height 0.5s ease",
                    minHeight: awayNums[i] > 0 ? "4px" : "0",
                  }} />
                </div>
                {/* Home bar */}
                <div style={{ position: "relative", width: "28px" }}>
                  {homeNums[i] > 0 && (
                    <span style={{
                      position: "absolute",
                      top: "-18px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      fontSize: "11px",
                      fontFamily: "var(--font-roboto-mono), monospace",
                      color: homeColor,
                      fontWeight: 600,
                    }}>
                      {homeNums[i]}
                    </span>
                  )}
                  <div style={{
                    width: "28px",
                    height: `${homeH}px`,
                    background: homeColor,
                    borderRadius: "3px 3px 0 0",
                    transition: "height 0.5s ease",
                    minHeight: homeNums[i] > 0 ? "4px" : "0",
                  }} />
                </div>
              </div>
              <span style={{
                marginTop: "8px",
                fontSize: "12px",
                color: "rgba(255,255,255,0.5)",
                fontWeight: 600,
              }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}



// ─── Momentum Meter ──────────────────────────────────────────────

function MomentumMeter({
  score, label, factors, awayAbbr, homeAbbr,
}: {
  score: number; label: string; factors: string[]; awayAbbr: string; homeAbbr: string;
}) {
  const position = ((score + 10) / 20) * 100; // -10..+10 → 0..100%

  return (
    <div style={{
      background: "var(--dark-gray)",
      padding: "20px 30px",
      marginBottom: "20px",
    }}>
      <div style={{
        fontSize: "12px",
        letterSpacing: "1px",
        color: "rgba(255,255,255,0.5)",
        marginBottom: "12px",
      }}>
        MOMENTUM
      </div>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "8px",
        fontSize: "13px",
        color: "rgba(255,255,255,0.5)",
      }}>
        <span>{awayAbbr}</span>
        <span style={{
          color: Math.abs(score) <= 1 ? "rgba(255,255,255,0.6)" :
            score > 0 ? "var(--orange)" : "var(--blue)",
          fontWeight: 600,
          fontSize: "14px",
        }}>
          {label}
        </span>
        <span>{homeAbbr}</span>
      </div>
      <div style={{
        position: "relative",
        height: "8px",
        background: "rgba(255,255,255,0.1)",
        borderRadius: "4px",
        marginBottom: "12px",
      }}>
        {/* Center line */}
        <div style={{
          position: "absolute",
          left: "50%",
          top: "-2px",
          width: "2px",
          height: "12px",
          background: "rgba(255,255,255,0.3)",
          transform: "translateX(-50%)",
        }} />
        {/* Indicator */}
        <div style={{
          position: "absolute",
          left: `${position}%`,
          top: "-4px",
          width: "16px",
          height: "16px",
          borderRadius: "50%",
          background: score > 1 ? "var(--orange)" : score < -1 ? "var(--blue)" : "rgba(255,255,255,0.5)",
          transform: "translateX(-50%)",
          transition: "left 0.5s ease",
          boxShadow: `0 0 8px ${score > 1 ? "rgba(255, 107, 53, 0.5)" : score < -1 ? "rgba(59, 130, 246, 0.5)" : "rgba(255,255,255,0.2)"}`,
        }} />
      </div>
      {factors.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {factors.map((f, i) => (
            <span key={i} style={{
              fontSize: "12px",
              color: "rgba(255,255,255,0.5)",
              background: "rgba(255,255,255,0.05)",
              padding: "4px 10px",
              borderRadius: "4px",
            }}>
              {f}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AI Insights Panel ───────────────────────────────────────────

function AiInsightsPanel({ insights }: { insights: string[] }) {
  return (
    <div style={{
      background: "rgba(255, 107, 53, 0.05)",
      border: "1px solid rgba(255, 107, 53, 0.15)",
      padding: "20px 25px",
      marginBottom: "20px",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "14px",
      }}>
        <span style={{
          fontSize: "12px",
          letterSpacing: "1px",
          color: "rgba(255,255,255,0.5)",
        }}>
          AI INSIGHTS
        </span>
        <span style={{
          fontSize: "9px",
          fontWeight: 700,
          letterSpacing: "0.5px",
          padding: "2px 8px",
          background: "rgba(255, 107, 53, 0.2)",
          color: "var(--orange)",
          borderRadius: "3px",
        }}>
          AI
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {insights.map((insight, i) => (
          <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <span style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "var(--orange)",
              marginTop: "7px",
              flexShrink: 0,
            }} />
            <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)", lineHeight: "1.5" }}>
              {insight}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Odds Card ───────────────────────────────────────────────────

function OddsCard({
  odds, homeAbbr, awayAbbr,
}: {
  odds: NonNullable<GameDetailsResponse["odds"]>;
  homeAbbr: string;
  awayAbbr: string;
}) {
  const formatMl = (ml: number | null) => {
    if (ml === null) return "-";
    return ml > 0 ? `+${ml}` : `${ml}`;
  };

  const formatSpread = (spread: number | null) => {
    if (spread === null) return "-";
    return spread > 0 ? `+${spread}` : `${spread}`;
  };

  return (
    <div style={{
      background: "var(--dark-gray)",
      padding: "20px 30px",
      marginBottom: "20px",
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px",
      }}>
        <span style={{ fontSize: "12px", letterSpacing: "1px", color: "rgba(255,255,255,0.5)" }}>
          ODDS
        </span>
        {odds.provider && (
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
            via {odds.provider}
          </span>
        )}
      </div>
      <div style={{
        display: "flex",
        justifyContent: "space-around",
        flexWrap: "wrap",
        gap: "20px",
      }}>
        <div style={{ textAlign: "center", minWidth: "100px" }}>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "6px", letterSpacing: "0.5px" }}>
            SPREAD
          </div>
          <div style={{ fontFamily: "var(--font-roboto-mono), monospace", fontSize: "20px", fontWeight: 700 }}>
            {odds.details || formatSpread(odds.spread)}
          </div>
        </div>
        <div style={{ width: "1px", background: "rgba(255,255,255,0.1)", alignSelf: "stretch" }} />
        <div style={{ textAlign: "center", minWidth: "100px" }}>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "6px", letterSpacing: "0.5px" }}>
            OVER/UNDER
          </div>
          <div style={{ fontFamily: "var(--font-roboto-mono), monospace", fontSize: "20px", fontWeight: 700 }}>
            {odds.overUnder ?? "-"}
          </div>
        </div>
        <div style={{ width: "1px", background: "rgba(255,255,255,0.1)", alignSelf: "stretch" }} />
        <div style={{ textAlign: "center", minWidth: "140px" }}>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "6px", letterSpacing: "0.5px" }}>
            MONEYLINE
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
            <div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "2px" }}>{awayAbbr}</div>
              <div style={{ fontFamily: "var(--font-roboto-mono), monospace", fontSize: "18px", fontWeight: 700 }}>
                {formatMl(odds.awayMoneyline)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "2px" }}>{homeAbbr}</div>
              <div style={{ fontFamily: "var(--font-roboto-mono), monospace", fontSize: "18px", fontWeight: 700 }}>
                {formatMl(odds.homeMoneyline)}
              </div>
            </div>
          </div>
        </div>
      </div>
      <p style={{
        fontSize: "10px",
        color: "rgba(255,255,255,0.25)",
        textAlign: "center",
        marginTop: "14px",
        lineHeight: "1.4",
      }}>
        For entertainment purposes only. Not financial advice. Please gamble responsibly.
        If you or someone you know has a gambling problem, call 1-800-GAMBLER.
      </p>
    </div>
  );
}

// ─── Existing Components ─────────────────────────────────────────

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

// ─── Main Page Content ───────────────────────────────────────────

function GamePageContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const league = searchParams.get("league") || "nba";
  const [data, setData] = useState<GameDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGame() {
      try {
        const res = await fetch(`/api/games/${id}?league=${league}`);
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
  }, [id, league, data?.game.status]);

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
          <div className="game-header-card" style={{
            background: "var(--dark-gray)",
            padding: "40px",
            marginBottom: "20px",
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
            <div className="game-matchup" style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "60px",
              flexWrap: "wrap",
            }}>
              {/* Away Team */}
              <div style={{ textAlign: "center" }}>
                <TeamLogo
                  logo={game.awayTeam.logo}
                  name={game.awayTeam.name}
                  abbreviation={game.awayTeam.abbreviation}
                />
                <h2 style={{
                  fontFamily: "var(--font-anton), Anton, sans-serif",
                  fontSize: "24px",
                  marginBottom: "5px",
                }}>
                  {game.awayTeam.name}
                </h2>
                <p style={{ color: "rgba(255,255,255,0.5)" }}>{game.awayTeam.abbreviation}</p>
                {data.records?.away && (
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", marginTop: "4px" }}>
                    {data.records.away}
                  </p>
                )}
              </div>

              {/* Score */}
              <div style={{ textAlign: "center" }}>
                <div className="game-score-display" style={{
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
                {game.broadcast && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    marginTop: "8px",
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
                      <polyline points="17 2 12 7 7 2" />
                    </svg>
                    <span style={{
                      fontFamily: "var(--font-roboto-mono), monospace",
                      fontSize: "14px",
                      color: "var(--orange)",
                      letterSpacing: "0.5px",
                      fontWeight: 600,
                    }}>
                      {game.broadcast}
                    </span>
                  </div>
                )}
                {data.seasonSeries && (
                  <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", marginTop: "6px" }}>
                    {data.seasonSeries}
                  </p>
                )}
              </div>

              {/* Home Team */}
              <div style={{ textAlign: "center" }}>
                <TeamLogo
                  logo={game.homeTeam.logo}
                  name={game.homeTeam.name}
                  abbreviation={game.homeTeam.abbreviation}
                />
                <h2 style={{
                  fontFamily: "var(--font-anton), Anton, sans-serif",
                  fontSize: "24px",
                  marginBottom: "5px",
                }}>
                  {game.homeTeam.name}
                </h2>
                <p style={{ color: "rgba(255,255,255,0.5)" }}>{game.homeTeam.abbreviation}</p>
                {data.records?.home && (
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", marginTop: "4px" }}>
                    {data.records.home}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ═══ ANALYTICS SECTION ═══ */}

          {/* Win Probability Bar */}
          {data.analytics?.winProbability && (
            <WinProbabilityBar
              home={data.analytics.winProbability.home}
              away={data.analytics.winProbability.away}
              homeAbbr={game.homeTeam.abbreviation}
              awayAbbr={game.awayTeam.abbreviation}
              isLive={game.status === "live"}
            />
          )}

          {/* Quarter Scores */}
          {data.linescores && (data.linescores.home.length > 0 || data.linescores.away.length > 0) && (
            <QuarterScoresTable
              homeLinescores={data.linescores.home}
              awayLinescores={data.linescores.away}
              homeAbbr={game.homeTeam.abbreviation}
              awayAbbr={game.awayTeam.abbreviation}
              homeScore={game.homeTeam.score}
              awayScore={game.awayTeam.score}
              period={game.period}
              isLive={game.status === "live"}
            />
          )}

          {/* Quarter Scores Chart */}
          {data.linescores && (data.linescores.home.length > 0 || data.linescores.away.length > 0) && (
            <QuarterScoresChart
              homeLinescores={data.linescores.home}
              awayLinescores={data.linescores.away}
              homeAbbr={game.homeTeam.abbreviation}
              awayAbbr={game.awayTeam.abbreviation}
            />
          )}

          {/* Odds Card */}
          {data.odds && (data.odds.spread !== null || data.odds.overUnder !== null) && (
            <OddsCard
              odds={data.odds}
              homeAbbr={game.homeTeam.abbreviation}
              awayAbbr={game.awayTeam.abbreviation}
            />
          )}

          {/* Momentum Meter — live games only */}
          {game.status === "live" && data.analytics?.momentum && (
            <MomentumMeter
              score={data.analytics.momentum.score}
              label={data.analytics.momentum.label}
              factors={data.analytics.momentum.factors}
              awayAbbr={game.awayTeam.abbreviation}
              homeAbbr={game.homeTeam.abbreviation}
            />
          )}

          {/* AI Insights */}
          {data.analytics?.insights && data.analytics.insights.length > 0 && (
            <AiInsightsPanel insights={data.analytics.insights} />
          )}

          {/* ═══ EXISTING SECTIONS ═══ */}

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

export default function GameClient({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={
      <>
        <Header />
        <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
          <div style={{ textAlign: "center", padding: "100px" }}>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading game data...</p>
          </div>
        </main>
        <Footer />
      </>
    }>
      <GamePageContent params={params} />
    </Suspense>
  );
}
