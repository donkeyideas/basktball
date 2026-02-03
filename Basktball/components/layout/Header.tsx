"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

export function Header() {
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    async function fetchLiveGames() {
      try {
        const res = await fetch("/api/games/live");
        const data = await res.json();
        if (data.success) {
          setLiveCount(data.games?.length || 0);
        }
      } catch {
        setLiveCount(0);
      }
    }
    fetchLiveGames();
    const interval = setInterval(fetchLiveGames, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header>
      {/* Top Bar */}
      <div className="top-bar">
        <div className="live-indicator">
          <span className="pulse-dot"></span>
          <span>{liveCount} GAMES LIVE NOW</span>
        </div>
        <span>UPDATED EVERY 30 SECONDS</span>
      </div>

      {/* Navigation */}
      <nav style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 40px",
        background: "var(--dark-gray)",
        borderBottom: "1px solid rgba(255,255,255,0.1)"
      }}>
        <Link href="/" style={{
          display: "flex",
          alignItems: "center",
          gap: "15px",
          textDecoration: "none"
        }}>
          <Image
            src="/logo-icon.png"
            alt="Basktball"
            width={50}
            height={50}
            style={{ borderRadius: "8px" }}
          />
          <span style={{
            fontFamily: "var(--font-anton), Anton, sans-serif",
            fontSize: "36px",
            color: "var(--white)",
            textShadow: "3px 3px 0 var(--orange)"
          }}>
            BASKTBALL
          </span>
        </Link>

        <div className="nav-links">
          <Link href="/live">LIVE</Link>
          <Link href="/stats">STATS</Link>
          <Link href="/tools">TOOLS</Link>
          <Link href="/players">PLAYERS</Link>
          <Link href="/teams">TEAMS</Link>
        </div>
      </nav>
    </header>
  );
}

export default Header;
