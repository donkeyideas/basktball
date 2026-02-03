"use client";

import { useState } from "react";
import Image from "next/image";
import { Header, Footer } from "@/components";
import { useGames, type Game, type GameTeam } from "@/hooks/useGames";

type League = "nba" | "wnba" | "ncaam" | "ncaaw" | "euro" | "intl";

const leagues: { id: League; name: string }[] = [
  { id: "nba", name: "NBA" },
  { id: "wnba", name: "WNBA" },
  { id: "ncaam", name: "NCAA M" },
  { id: "ncaaw", name: "NCAA W" },
  { id: "euro", name: "EURO" },
  { id: "intl", name: "INTL" },
];

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

function GameCard({ game }: { game: Game }) {
  const isLive = game.status === "live";
  const isFinal = game.status === "final";

  return (
    <div className="game-card">
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
          background: "rgba(255,255,255,0.2)",
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
    </div>
  );
}

export default function LivePage() {
  const [selectedLeague, setSelectedLeague] = useState<League>("nba");
  const { games, isLoading, error, lastUpdated, refetch } = useGames({
    league: selectedLeague,
    refreshInterval: 30000
  });

  const liveGames = games.filter(g => g.status === "live");
  const completedGames = games.filter(g => g.status === "final");
  const scheduledGames = games.filter(g => g.status === "scheduled");

  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          {/* Page Header */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "40px"
          }}>
            <h1 style={{
              fontFamily: "var(--font-anton), Anton, sans-serif",
              fontSize: "48px",
              display: "flex",
              alignItems: "center",
              gap: "15px"
            }}>
              <span className="pulse-dot" style={{
                width: "12px",
                height: "12px",
                background: "var(--orange)"
              }}></span>
              LIVE SCORES
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              {lastUpdated && (
                <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)" }}>
                  Updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <button className="btn btn-primary" onClick={() => refetch()}>
                Refresh
              </button>
            </div>
          </div>

          {/* League Filter */}
          <div style={{
            display: "flex",
            gap: "10px",
            marginBottom: "40px",
            flexWrap: "wrap"
          }}>
            {leagues.map(league => (
              <button
                key={league.id}
                onClick={() => setSelectedLeague(league.id)}
                style={{
                  padding: "12px 24px",
                  background: selectedLeague === league.id ? "var(--orange)" : "var(--dark-gray)",
                  border: "2px solid",
                  borderColor: selectedLeague === league.id ? "var(--orange)" : "rgba(255,255,255,0.1)",
                  color: "var(--white)",
                  fontFamily: "var(--font-barlow), sans-serif",
                  fontSize: "16px",
                  fontWeight: "600",
                  letterSpacing: "1px",
                  cursor: "pointer",
                  transition: "all 0.3s ease"
                }}
              >
                {league.name}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div style={{ textAlign: "center", padding: "60px" }}>
              <p style={{ color: "rgba(255,255,255,0.5)" }}>Loading games...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "60px" }}>
              <p style={{ color: "var(--red)" }}>Failed to load games. Please try again.</p>
              <button className="btn btn-primary" onClick={() => refetch()} style={{ marginTop: "20px" }}>
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Live Games */}
              {liveGames.length > 0 && (
                <section style={{ marginBottom: "60px" }}>
                  <h2 style={{
                    fontFamily: "var(--font-anton), Anton, sans-serif",
                    fontSize: "32px",
                    marginBottom: "30px",
                    color: "var(--red)",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px"
                  }}>
                    <span className="pulse-dot" style={{ background: "var(--red)" }}></span>
                    LIVE NOW ({liveGames.length})
                  </h2>
                  <div className="games-grid">
                    {liveGames.map(game => (
                      <GameCard key={game.id} game={game} />
                    ))}
                  </div>
                </section>
              )}

              {/* Scheduled Games */}
              {scheduledGames.length > 0 && (
                <section style={{ marginBottom: "60px" }}>
                  <h2 style={{
                    fontFamily: "var(--font-anton), Anton, sans-serif",
                    fontSize: "32px",
                    marginBottom: "30px"
                  }}>
                    UPCOMING ({scheduledGames.length})
                  </h2>
                  <div className="games-grid">
                    {scheduledGames.map(game => (
                      <GameCard key={game.id} game={game} />
                    ))}
                  </div>
                </section>
              )}

              {/* Completed Games */}
              {completedGames.length > 0 && (
                <section style={{ marginBottom: "60px" }}>
                  <h2 style={{
                    fontFamily: "var(--font-anton), Anton, sans-serif",
                    fontSize: "32px",
                    marginBottom: "30px",
                    color: "rgba(255,255,255,0.5)"
                  }}>
                    COMPLETED ({completedGames.length})
                  </h2>
                  <div className="games-grid">
                    {completedGames.map(game => (
                      <GameCard key={game.id} game={game} />
                    ))}
                  </div>
                </section>
              )}

              {/* No Games */}
              {games.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px" }}>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "18px" }}>
                    No games scheduled for {leagues.find(l => l.id === selectedLeague)?.name}.
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.3)", marginTop: "10px" }}>
                    Check back soon for upcoming games!
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
