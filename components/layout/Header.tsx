"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";

export function Header() {
  const { data: session } = useSession();
  const [liveCount, setLiveCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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

  // Close menu on route change (link click)
  const handleLinkClick = () => setMenuOpen(false);

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 50, boxShadow: "0 20px 0 0 #0D0D0D" }}>
      {/* Top Bar */}
      <div className="top-bar">
        <div className="live-indicator">
          <span className="pulse-dot"></span>
          <span>{liveCount} GAMES LIVE NOW</span>
        </div>
        <span className="top-bar-update">UPDATED EVERY 30 SECONDS</span>
      </div>

      {/* Navigation */}
      <nav style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 40px",
        background: "var(--dark-gray)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        position: "relative",
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
          <span className="logo-text" style={{
            fontFamily: "var(--font-anton), Anton, sans-serif",
            fontSize: "36px",
            color: "var(--white)",
            textShadow: "3px 3px 0 var(--orange)"
          }}>
            BASKTBALL
          </span>
        </Link>

        {/* Hamburger button — mobile only */}
        <button
          className="hamburger-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
        >
          <span style={{
            display: "block",
            width: "24px",
            height: "2px",
            background: "var(--white)",
            transition: "all 0.3s ease",
            transform: menuOpen ? "rotate(45deg) translate(5px, 5px)" : "none",
          }} />
          <span style={{
            display: "block",
            width: "24px",
            height: "2px",
            background: "var(--white)",
            transition: "all 0.3s ease",
            opacity: menuOpen ? 0 : 1,
          }} />
          <span style={{
            display: "block",
            width: "24px",
            height: "2px",
            background: "var(--white)",
            transition: "all 0.3s ease",
            transform: menuOpen ? "rotate(-45deg) translate(5px, -5px)" : "none",
          }} />
        </button>

        {/* Desktop nav */}
        <div className="nav-links">
          <Link href="/news">NEWS</Link>
          <Link href="/scores">SCORES</Link>
          <Link href="/standings">STANDINGS</Link>
          <Link href="/schedule">SCHEDULE</Link>
          <Link href="/stats">STATS</Link>
          <Link href="/teams">TEAMS</Link>
          <Link href="/tools">TOOLS</Link>
          <Link href="/court" style={{ color: "var(--orange)" }}>THE COURT</Link>
          <Link href="/contact">CONTACT</Link>
        </div>

        {/* User auth section */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginLeft: "16px" }}>
          {session?.user ? (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "none",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  cursor: "pointer",
                  color: "#fff",
                  fontSize: "13px",
                  fontFamily: "var(--font-barlow)",
                }}
              >
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "#FF6B35",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: "700",
                  overflow: "hidden",
                }}>
                  {session.user.image ? (
                    <img src={session.user.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    (session.user.name || "U").charAt(0).toUpperCase()
                  )}
                </div>
                <span className="user-name-text">{session.user.name || "User"}</span>
              </button>
              {userMenuOpen && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "4px",
                  background: "#1A1A1A",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  padding: "8px 0",
                  minWidth: "150px",
                  zIndex: 100,
                }}>
                  <Link
                    href="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "8px 16px",
                      color: "rgba(255,255,255,0.8)",
                      fontSize: "13px",
                      textDecoration: "none",
                      fontFamily: "var(--font-barlow)",
                      fontWeight: 600,
                    }}
                  >
                    Edit Profile
                  </Link>
                  <div style={{ height: "1px", background: "rgba(255,255,255,0.08)", margin: "4px 0" }} />
                  <button
                    onClick={() => { signOut({ callbackUrl: "/" }); setUserMenuOpen(false); }}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "8px 16px",
                      background: "none",
                      border: "none",
                      color: "#EF4444",
                      fontSize: "13px",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "var(--font-barlow)",
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="sign-in-btn"
              style={{
                padding: "6px 16px",
                borderRadius: "6px",
                border: "1px solid var(--orange)",
                color: "var(--orange)",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: "600",
                fontFamily: "var(--font-barlow)",
                whiteSpace: "nowrap",
              }}
            >
              SIGN IN
            </Link>
          )}
        </div>

        {/* Mobile nav overlay */}
        {menuOpen && (
          <div className="mobile-nav">
            <Link href="/news" onClick={handleLinkClick}>NEWS</Link>
            <Link href="/scores" onClick={handleLinkClick}>SCORES</Link>
            <Link href="/standings" onClick={handleLinkClick}>STANDINGS</Link>
            <Link href="/schedule" onClick={handleLinkClick}>SCHEDULE</Link>
            <Link href="/stats" onClick={handleLinkClick}>STATS</Link>
            <Link href="/teams" onClick={handleLinkClick}>TEAMS</Link>
            <Link href="/tools" onClick={handleLinkClick}>TOOLS</Link>
            <Link href="/court" onClick={handleLinkClick} style={{ color: "var(--orange)" }}>THE COURT</Link>
            <Link href="/contact" onClick={handleLinkClick}>CONTACT</Link>
            {!session?.user && (
              <Link href="/login" onClick={handleLinkClick} style={{ color: "var(--orange)" }}>SIGN IN</Link>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}

export default Header;
