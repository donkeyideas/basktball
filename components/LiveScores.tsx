"use client";

import Image from "next/image";
import Link from "next/link";
import { useGames, type Game, type GameTeam } from "@/hooks/useGames";

interface LiveScoresProps {
  league?: "nba" | "wnba" | "ncaam" | "ncaaw" | "euro" | "intl";
}

function TeamLogo({ team }: { team: GameTeam }) {
  if (team.logoUrl) {
    return (
      <div className="team-logo" style={{ padding: 0, overflow: "hidden" }}>
        <Image
          src={team.logoUrl}
          alt={team.name}
          width={50}
          height={50}
          style={{ objectFit: "contain" }}
          onError={(e) => {
            // Fallback to abbreviation if image fails
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            if (target.parentElement) {
              target.parentElement.textContent = team.abbreviation;
            }
          }}
        />
      </div>
    );
  }
  return <div className="team-logo">{team.abbreviation}</div>;
}

function GameCard({ game, league }: { game: Game; league: string }) {
  const isLive = game.status === "live";
  const isFinal = game.status === "final";

  return (
    <Link href={`/game/${game.id}?league=${league}`} className="game-card" style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}>
      {isLive && (
        <span style={{
          position: "absolute",
          top: "15px",
          right: "15px",
          background: "var(--red)",
          padding: "5px 15px",
          fontSize: "12px",
          fontWeight: "bold",
          letterSpacing: "1px",
          animation: "blink 1s ease-in-out infinite"
        }}>LIVE</span>
      )}
      {isFinal && (
        <span style={{
          position: "absolute",
          top: "15px",
          right: "15px",
          background: "var(--text-faint)",
          padding: "5px 15px",
          fontSize: "12px",
          fontWeight: "bold",
          letterSpacing: "1px"
        }}>FINAL</span>
      )}
      <div className="teams">
        <div className="team">
          <TeamLogo team={game.awayTeam} />
          <div className="team-info">
            <div className="team-name">{game.awayTeam.name}</div>
          </div>
          <div className="score">{game.awayTeam.score}</div>
        </div>
        <div className="team">
          <TeamLogo team={game.homeTeam} />
          <div className="team-info">
            <div className="team-name">{game.homeTeam.name}</div>
          </div>
          <div className="score">{game.homeTeam.score}</div>
        </div>
      </div>
      <div className="game-stats">
        {game.stats.map((stat, index) => (
          <span key={index}>
            {stat.label}: <strong>{stat.value}</strong>
          </span>
        ))}
      </div>
      {game.broadcast && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginTop: "6px",
          paddingTop: "6px",
          borderTop: "1px solid var(--border-subtle)",
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    </Link>
  );
}

export function LiveScores({ league = "nba" }: LiveScoresProps) {
  const { games, isLoading, error, lastUpdated } = useGames({
    league,
    refreshInterval: 30000
  });

  if (error) {
    return (
      <section className="live-scores">
        <div className="section-header">
          <h2>
            <span className="pulse-dot"></span>
            LIVE SCORES
          </h2>
        </div>
        <p style={{ textAlign: "center", color: "var(--text-muted)" }}>
          Unable to load live scores. Please try again later.
        </p>
      </section>
    );
  }

  return (
    <section className="live-scores">
      <div className="section-header">
        <h2>
          <span className="pulse-dot"></span>
          LIVE SCORES
        </h2>
        {lastUpdated && (
          <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>
            Updated: {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="games-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="game-card" style={{ opacity: 0.5 }}>
              <div style={{
                height: "150px",
                background: "var(--input-bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                Loading...
              </div>
            </div>
          ))}
        </div>
      ) : games.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>
          No games currently scheduled. Check back soon!
        </p>
      ) : (
        <div className="games-grid">
          {/* Sort: live first, then scheduled, then final */}
          {[...games]
            .sort((a, b) => {
              const order = { live: 0, scheduled: 1, final: 2 };
              return order[a.status] - order[b.status];
            })
            .slice(0, 6)
            .map((game) => (
              <GameCard key={game.id} game={game} league={league} />
            ))}
        </div>
      )}
    </section>
  );
}

export default LiveScores;
