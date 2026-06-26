"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

export interface PlayerCardData {
  id: string;
  nbaId?: string;
  name: string;
  team?: {
    id?: string;
    name: string;
    abbreviation?: string;
  };
  position?: string;
  height?: string;
  weight?: string;
  jerseyNumber?: string;
  headshotUrl?: string;
}

function PlayerCard({ player }: { player: PlayerCardData }) {
  const playerId = player.nbaId || player.id;
  return (
    <Link
      key={player.id}
      href={`/player/${playerId}`}
      className="player-card"
      style={{
        padding: "25px",
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        gap: "20px",
        textDecoration: "none",
        color: "inherit",
        cursor: "pointer",
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
        flexShrink: 0,
        overflow: "hidden",
      }}>
        {player.headshotUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={player.headshotUrl}
            alt={player.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              if (target.parentElement) {
                target.parentElement.textContent = player.jerseyNumber || player.name.split(" ").map((n) => n[0]).join("");
              }
            }}
          />
        ) : (
          player.jerseyNumber || player.name.split(" ").map((n) => n[0]).join("")
        )}
      </div>
      <div style={{ flex: 1 }}>
        <h3 style={{
          fontFamily: "var(--font-anton), Anton, sans-serif",
          fontSize: "20px",
          marginBottom: "5px",
        }}>
          {player.name}
        </h3>
        <p style={{ color: "var(--orange)", marginBottom: "5px" }}>
          {player.team?.name || "Free Agent"}
        </p>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
          {[player.position, player.height, player.weight].filter(Boolean).join(" | ")}
        </p>
      </div>
    </Link>
  );
}

export default function PlayersSearchClient({ initialPlayers }: { initialPlayers: PlayerCardData[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [players, setPlayers] = useState<PlayerCardData[]>([]);
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
      {/* Search Input */}
      <div style={{ maxWidth: "600px", margin: "0 auto 40px" }}>
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
              border: "2px solid var(--border-color)",
              color: "var(--white)",
              fontSize: "18px",
              fontFamily: "var(--font-inter), sans-serif",
            }}
          />
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-muted)"
            strokeWidth="2"
            style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)" }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <p style={{ textAlign: "center", color: "var(--text-faint)", marginTop: "10px", fontSize: "14px" }}>
          Enter at least 2 characters to search
        </p>
      </div>

      {/* Results / Popular */}
      <div className="section">
        <div className="section-title">
          {hasSearched ? `Search Results (${players.length})` : "Popular Players"}
        </div>

        {isLoading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ color: "var(--text-muted)" }}>Searching...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ color: "var(--red)" }}>{error}</p>
          </div>
        ) : hasSearched && players.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ color: "var(--text-muted)" }}>
              No players found for &quot;{searchQuery}&quot;
            </p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "20px",
          }}>
            {(hasSearched ? players : initialPlayers).map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
