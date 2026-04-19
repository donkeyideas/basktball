"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Header, Footer } from "@/components";
import TakeCard from "@/components/court/TakeCard";
import type { Take } from "@/components/court/TakeCard";
import Link from "next/link";

type SearchTab = "ALL" | "TAKES" | "USERS" | "PLAYERS";

interface SearchUser {
  id: string;
  handle: string | null;
  displayName: string | null;
  name: string | null;
  avatarUrl: string | null;
  image: string | null;
  bio: string | null;
  followerCount: number;
  takeCount: number;
}

interface SearchPlayer {
  id: string;
  name: string;
  position: string | null;
  teamId: string | null;
  headshotUrl: string | null;
  team: { name: string; abbreviation: string } | null;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("ALL");
  const [takes, setTakes] = useState<Take[]>([]);
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [players, setPlayers] = useState<SearchPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const doSearch = useCallback(async (q: string, tab: SearchTab) => {
    if (!q.trim()) {
      setTakes([]);
      setUsers([]);
      setPlayers([]);
      setHasSearched(false);
      return;
    }
    setLoading(true);
    setHasSearched(true);
    try {
      const type = tab.toLowerCase();
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=${type}`);
      const data = await res.json();
      if (data.takes) setTakes(data.takes.map((t: Take) => ({ ...t, userReaction: null, userBookmarked: false, userReposted: false })));
      if (data.users) setUsers(data.users);
      if (data.players) setPlayers(data.players);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setQuery(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => doSearch(val, activeTab), 400);
    },
    [doSearch, activeTab]
  );

  const handleTabChange = useCallback(
    (tab: SearchTab) => {
      setActiveTab(tab);
      if (query.trim()) doSearch(query, tab);
    },
    [query, doSearch]
  );

  const tabs: SearchTab[] = ["ALL", "TAKES", "USERS", "PLAYERS"];

  return (
    <>
      <Header />
      <main
        style={{
          minHeight: "100vh",
          backgroundColor: "var(--black)",
          paddingTop: "80px",
          paddingBottom: "60px",
        }}
      >
        <div style={{ maxWidth: "680px", margin: "0 auto", padding: "0 16px" }}>
          {/* Search bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                borderRadius: "12px",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--border-subtle)",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleQueryChange}
                placeholder="Search takes, users, players..."
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "var(--text-primary)",
                  fontSize: "15px",
                  fontFamily: "var(--font-inter), sans-serif",
                }}
              />
            </div>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: "4px",
              marginBottom: "20px",
              borderBottom: "1px solid var(--border-subtle)",
              paddingBottom: "2px",
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                style={{
                  padding: "8px 16px",
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: activeTab === tab ? "#FF6B35" : "var(--text-faint)",
                  borderBottom: activeTab === tab ? "2px solid #FF6B35" : "2px solid transparent",
                  transition: "color 0.15s ease",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Results */}
          {loading && (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-faint)", fontFamily: "var(--font-inter), sans-serif" }}>
              Searching...
            </div>
          )}

          {!loading && hasSearched && takes.length === 0 && users.length === 0 && players.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-faint)", fontFamily: "var(--font-inter), sans-serif" }}>
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}

          {!loading && !hasSearched && (
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-faint)", fontFamily: "var(--font-inter), sans-serif" }}>
              Search for takes, users, and players
            </div>
          )}

          {/* Users section */}
          {!loading && users.length > 0 && (activeTab === "ALL" || activeTab === "USERS") && (
            <div style={{ marginBottom: "24px" }}>
              {activeTab === "ALL" && (
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-faint)", fontFamily: "var(--font-inter), sans-serif", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>
                  Users
                </div>
              )}
              {users.map((user) => (
                <Link
                  key={user.id}
                  href={user.handle ? `/user/${user.handle}` : `/profile/${user.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      marginBottom: "4px",
                      cursor: "pointer",
                      transition: "background-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--border-subtle)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        backgroundColor: "#FF6B35",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        flexShrink: 0,
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "var(--white)",
                        fontFamily: "var(--font-anton), sans-serif",
                      }}
                    >
                      {user.avatarUrl || user.image ? (
                        <img src={user.avatarUrl || user.image || ""} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        (user.displayName || user.name || "?").charAt(0).toUpperCase()
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-inter), sans-serif" }}>
                        {user.displayName || user.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-faint)", fontFamily: "var(--font-inter), sans-serif" }}>
                        {user.handle && `@${user.handle} · `}{user.followerCount} followers · {user.takeCount} takes
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Players section */}
          {!loading && players.length > 0 && (activeTab === "ALL" || activeTab === "PLAYERS") && (
            <div style={{ marginBottom: "24px" }}>
              {activeTab === "ALL" && (
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-faint)", fontFamily: "var(--font-inter), sans-serif", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>
                  Players
                </div>
              )}
              {players.map((player) => (
                <Link
                  key={player.id}
                  href={`/player/${player.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      marginBottom: "4px",
                      cursor: "pointer",
                      transition: "background-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--border-subtle)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        backgroundColor: "var(--border-subtle)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        flexShrink: 0,
                      }}
                    >
                      {player.headshotUrl ? (
                        <img src={player.headshotUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-faint)", fontFamily: "var(--font-anton), sans-serif" }}>
                          {player.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-inter), sans-serif" }}>
                        {player.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-faint)", fontFamily: "var(--font-inter), sans-serif" }}>
                        {player.position}{player.team ? ` · ${player.team.name}` : ""}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Takes section */}
          {!loading && takes.length > 0 && (activeTab === "ALL" || activeTab === "TAKES") && (
            <div>
              {activeTab === "ALL" && (
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-faint)", fontFamily: "var(--font-inter), sans-serif", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>
                  Takes
                </div>
              )}
              {takes.map((take) => (
                <TakeCard key={take.id} take={take} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
