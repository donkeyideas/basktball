"use client";

import { useState, useEffect, useCallback } from "react";
import { Header, Footer } from "@/components";

interface Player {
  id: string;
  name: string;
  team?: {
    id: string;
    name: string;
    abbreviation: string;
  };
  position?: string;
  height?: string;
  weight?: string;
  jerseyNumber?: string;
}

export default function PlayersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const searchPlayers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setPlayers([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/players?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        setPlayers(data.players || []);
      } else {
        setError(data.error || "Failed to search players");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchPlayers(searchQuery);
      } else if (searchQuery.length === 0) {
        setPlayers([]);
        setHasSearched(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchPlayers]);

  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {/* Page Header */}
          <h1 style={{
            fontFamily: "var(--font-anton), Anton, sans-serif",
            fontSize: "48px",
            marginBottom: "40px",
            textAlign: "center"
          }}>
            PLAYER SEARCH
            <span style={{
              display: "block",
              width: "100px",
              height: "4px",
              background: "var(--orange)",
              margin: "15px auto 0"
            }}></span>
          </h1>

          {/* Search Input */}
          <div style={{
            maxWidth: "600px",
            margin: "0 auto 40px"
          }}>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a player..."
                style={{
                  width: "100%",
                  padding: "15px 20px 15px 50px",
                  background: "var(--dark-gray)",
                  border: "2px solid rgba(255,255,255,0.1)",
                  color: "var(--white)",
                  fontSize: "18px",
                  fontFamily: "var(--font-barlow), sans-serif"
                }}
              />
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="2"
                style={{
                  position: "absolute",
                  left: "15px",
                  top: "50%",
                  transform: "translateY(-50%)"
                }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <p style={{
              textAlign: "center",
              color: "rgba(255,255,255,0.4)",
              marginTop: "10px",
              fontSize: "14px"
            }}>
              Enter at least 2 characters to search
            </p>
          </div>

          {/* Results */}
          <div className="section">
            <div className="section-title">
              {hasSearched ? `Search Results (${players.length})` : "Search for Players"}
            </div>

            {isLoading ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <p style={{ color: "rgba(255,255,255,0.5)" }}>Searching...</p>
              </div>
            ) : error ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <p style={{ color: "var(--red)" }}>{error}</p>
              </div>
            ) : !hasSearched ? (
              <div style={{ textAlign: "center", padding: "60px" }}>
                <svg
                  width="80"
                  height="80"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="1"
                  style={{ margin: "0 auto 20px" }}
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "16px" }}>
                  Start typing to search for players
                </p>
              </div>
            ) : players.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <p style={{ color: "rgba(255,255,255,0.5)" }}>
                  No players found for &quot;{searchQuery}&quot;
                </p>
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "20px"
              }}>
                {players.map(player => (
                  <div
                    key={player.id}
                    className="player-card"
                    style={{
                      padding: "25px",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: "20px"
                    }}
                  >
                    <div style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      background: "var(--orange)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-anton), Anton, sans-serif",
                      fontSize: "24px",
                      flexShrink: 0
                    }}>
                      {player.jerseyNumber || player.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontFamily: "var(--font-anton), Anton, sans-serif",
                        fontSize: "20px",
                        marginBottom: "5px"
                      }}>
                        {player.name}
                      </h3>
                      <p style={{ color: "var(--orange)", marginBottom: "5px" }}>
                        {player.team?.name || "Free Agent"}
                      </p>
                      <p style={{
                        color: "rgba(255,255,255,0.5)",
                        fontSize: "14px"
                      }}>
                        {[player.position, player.height, player.weight].filter(Boolean).join(" | ")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
