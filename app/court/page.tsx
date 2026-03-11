"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Header, Footer } from "@/components";
import TakeCard from "@/components/court/TakeCard";
import type { Take } from "@/components/court/TakeCard";
import ComposeTake from "@/components/court/ComposeTake";
import FeedTabs from "@/components/court/FeedTabs";
import type { FeedTab } from "@/components/court/FeedTabs";

function feedTabToApiType(tab: FeedTab): string {
  if (tab === "FOR YOU") return "foryou";
  if (tab === "FOLLOWING") return "following";
  return "live";
}


export default function CourtPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<FeedTab>("FOR YOU");
  const [takes, setTakes] = useState<Take[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [composeGameId, setComposeGameId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [feedError, setFeedError] = useState(false);

  // Sidebar data
  const [newsArticles, setNewsArticles] = useState<{ id: string; title: string; link: string; imageUrl?: string; source: string; pubDate: string }[]>([]);
  // stats removed per user request
  const [suggestedUsers, setSuggestedUsers] = useState<{ id: string; name: string; takeCount: number; image: string | null }[]>([]);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [followLoading, setFollowLoading] = useState<Set<string>>(new Set());
  const [hasLiveGames, setHasLiveGames] = useState(false);
  const [liveGames, setLiveGames] = useState<{ id: string; homeTeam: { abbreviation: string; logoUrl?: string }; awayTeam: { abbreviation: string; logoUrl?: string }; homeScore: number; awayScore: number; status: string; quarter?: string; clock?: string }[]>([]);

  // Fetch feed from API
  const fetchFeed = useCallback(async (tab: FeedTab, cursor?: string) => {
    try {
      if (cursor) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setFeedError(false);
      }
      const type = feedTabToApiType(tab);
      const params = new URLSearchParams({ type, limit: "20" });
      if (cursor) params.set("cursor", cursor);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(`/api/court/feed?${params.toString()}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const newTakes: Take[] = (data.takes || []).map((t: Record<string, unknown>) => ({
          ...t,
          userReaction: t.userReaction || null,
          userBookmarked: !!t.userBookmarked,
          userReposted: !!t.userReposted,
        }));
        if (cursor) {
          setTakes((prev) => [...prev, ...newTakes]);
        } else {
          setTakes(newTakes);
        }
        setNextCursor(data.nextCursor || null);
      } else {
        if (!cursor) setFeedError(true);
      }
    } catch {
      if (!cursor) setFeedError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Fetch sidebar data
  const fetchSidebarData = useCallback(async () => {
    try {
      const [newsRes, usersRes, liveRes] = await Promise.allSettled([
        fetch("/api/news?limit=5"),
        fetch("/api/court/suggested-users"),
        fetch("/api/games/live"),
      ]);

      if (newsRes.status === "fulfilled" && newsRes.value.ok) {
        const data = await newsRes.value.json();
        setNewsArticles((data.articles || []).slice(0, 5));
      }
      if (usersRes.status === "fulfilled" && usersRes.value.ok) {
        const data = await usersRes.value.json();
        setSuggestedUsers(data.users || []);
      }
      if (liveRes.status === "fulfilled" && liveRes.value.ok) {
        const data = await liveRes.value.json();
        const games = data.games || [];
        setHasLiveGames(games.length > 0);
        setLiveGames(games.slice(0, 5));
      }
    } catch {
      // Sidebar fetch failed silently
    }
  }, []);

  // Load feed on mount and tab change
  useEffect(() => {
    fetchFeed(activeTab);
  }, [activeTab, fetchFeed]);

  // Load sidebar data on mount + refresh live scores every 30s
  useEffect(() => {
    fetchSidebarData();
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/games/live");
        if (res.ok) {
          const data = await res.json();
          const games = data.games || [];
          setHasLiveGames(games.length > 0);
          setLiveGames(games.slice(0, 5));
        }
      } catch { /* ignore */ }
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchSidebarData]);

  const handleTabChange = useCallback((tab: FeedTab) => {
    setActiveTab(tab);
    setNextCursor(null);
  }, []);

  // Real API: react to a take
  const handleReact = useCallback(async (takeId: string, reaction: "FIRE" | "BRICK") => {
    // Optimistic update
    setTakes((prev) =>
      prev.map((t) => {
        if (t.id !== takeId) return t;
        const wasReaction = t.userReaction === reaction;
        let fireCount = t.fireCount;
        let brickCount = t.brickCount;
        if (t.userReaction === "FIRE") fireCount--;
        if (t.userReaction === "BRICK") brickCount--;
        if (!wasReaction) {
          if (reaction === "FIRE") fireCount++;
          if (reaction === "BRICK") brickCount++;
        }
        return { ...t, fireCount, brickCount, userReaction: wasReaction ? null : reaction };
      })
    );
    try {
      await fetch(`/api/court/takes/${takeId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: reaction }),
      });
    } catch {
      // Revert on failure by re-fetching
      fetchFeed(activeTab);
    }
  }, [activeTab, fetchFeed]);

  // Real API: bookmark a take
  const handleBookmark = useCallback(async (takeId: string) => {
    setTakes((prev) =>
      prev.map((t) => (t.id === takeId ? { ...t, userBookmarked: !t.userBookmarked } : t))
    );
    try {
      await fetch(`/api/court/takes/${takeId}/bookmark`, { method: "POST" });
    } catch {
      fetchFeed(activeTab);
    }
  }, [activeTab, fetchFeed]);

  // Real API: repost a take
  const handleRepost = useCallback(async (takeId: string) => {
    setTakes((prev) =>
      prev.map((t) =>
        t.id === takeId
          ? { ...t, userReposted: !t.userReposted, repostCount: t.repostCount + (t.userReposted ? -1 : 1) }
          : t
      )
    );
    try {
      await fetch(`/api/court/takes/${takeId}/repost`, { method: "POST" });
    } catch {
      fetchFeed(activeTab);
    }
  }, [activeTab, fetchFeed]);

  // Real API: delete a take
  const handleDelete = useCallback(async (takeId: string) => {
    setTakes((prev) => prev.filter((t) => t.id !== takeId));
    try {
      await fetch(`/api/court/takes/${takeId}`, { method: "DELETE" });
    } catch {
      fetchFeed(activeTab);
    }
  }, [activeTab, fetchFeed]);

  // Open reply modal
  const handleReply = useCallback((takeId: string) => {
    setReplyToId(takeId);
    setShowCompose(true);
  }, []);

  // Real API: vote on a poll
  const handlePollVote = useCallback(async (takeId: string, optionId: string) => {
    // Optimistic update
    setTakes((prev) =>
      prev.map((t) => {
        if (t.id !== takeId || !t.poll) return t;
        return {
          ...t,
          poll: {
            ...t.poll,
            totalVotes: t.poll.totalVotes + 1,
            votes: [{ optionId }],
            options: t.poll.options.map((o) =>
              o.id === optionId ? { ...o, voteCount: o.voteCount + 1 } : o
            ),
          },
        };
      })
    );
    try {
      await fetch(`/api/court/takes/${takeId}/poll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId }),
      });
    } catch {
      fetchFeed(activeTab);
    }
  }, [activeTab, fetchFeed]);

  // Add newly composed take to feed (ComposeTake already POSTed to API)
  const handleCompose = useCallback((data: Record<string, unknown>) => {
    if (data.take) {
      const take = data.take as Take;
      setTakes((prev) => [{ ...take, userReaction: null, userBookmarked: false, userReposted: false }, ...prev]);
    }
  }, []);

  const handleFollow = useCallback(async (targetUserId: string) => {
    if (!session?.user) return;
    setFollowLoading((prev) => new Set(prev).add(targetUserId));
    try {
      const res = await fetch("/api/court/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });
      if (res.ok) {
        const { action } = await res.json();
        setFollowedIds((prev) => {
          const next = new Set(prev);
          if (action === "followed") next.add(targetUserId);
          else next.delete(targetUserId);
          return next;
        });
      }
    } catch {
      // silently fail
    } finally {
      setFollowLoading((prev) => {
        const next = new Set(prev);
        next.delete(targetUserId);
        return next;
      });
    }
  }, [session]);

  const handleLoadMore = useCallback(() => {
    if (nextCursor && !loadingMore) {
      fetchFeed(activeTab, nextCursor);
    }
  }, [activeTab, nextCursor, loadingMore, fetchFeed]);

  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
        <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
          {/* Page Header */}
          <div style={{ marginBottom: "28px" }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "6px",
            }}>
              <h1 style={{
                fontFamily: "var(--font-anton), Anton, sans-serif",
                fontSize: "40px",
                color: "#FF6B35",
                margin: 0,
                letterSpacing: "2px",
              }}>
                THE COURT
              </h1>
              {session?.user ? (
                <button
                  onClick={() => {
                    setReplyToId(null);
                    setComposeGameId(activeTab === "LIVE" && liveGames.length > 0 ? liveGames[0].id : null);
                    setShowCompose(true);
                  }}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "8px",
                    background: "#FF6B35",
                    color: "#fff",
                    border: "none",
                    fontWeight: "700",
                    fontSize: "14px",
                    fontFamily: "var(--font-barlow), sans-serif",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    cursor: "pointer",
                  }}
                >
                  New Take
                </button>
              ) : (
                <Link
                  href="/login"
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "1px solid #FF6B35",
                    color: "#FF6B35",
                    textDecoration: "none",
                    fontWeight: "600",
                    fontSize: "14px",
                    fontFamily: "var(--font-barlow), sans-serif",
                  }}
                >
                  Sign In to Join
                </Link>
              )}
            </div>
            <p style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: "15px",
              fontFamily: "var(--font-barlow), sans-serif",
              margin: 0,
            }}>
              Where basketball talk lives
            </p>
          </div>

          {/* Main Content Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 320px",
            gap: "28px",
            alignItems: "start",
          }}>
            {/* Feed Column */}
            <div>
              <div style={{
                background: "#1A1A1A",
                borderRadius: "12px 12px 0 0",
                border: "1px solid #2a2a2a",
                borderBottom: "none",
                overflow: "hidden",
              }}>
                <FeedTabs
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                  hasLiveGames={hasLiveGames}
                />
              </div>

              <div style={{
                background: "#1A1A1A",
                borderRadius: "0 0 12px 12px",
                border: "1px solid #2a2a2a",
                borderTop: "none",
                overflow: "hidden",
              }}>
                {loading ? (
                  <div style={{
                    padding: "60px 20px",
                    textAlign: "center",
                    color: "rgba(255,255,255,0.35)",
                    fontFamily: "var(--font-barlow), sans-serif",
                    fontSize: "15px",
                  }}>
                    Loading takes...
                  </div>
                ) : feedError ? (
                  <div style={{
                    padding: "60px 20px",
                    textAlign: "center",
                  }}>
                    <div style={{
                      color: "rgba(255,255,255,0.5)",
                      fontFamily: "var(--font-barlow), sans-serif",
                      fontSize: "16px",
                      marginBottom: "12px",
                    }}>
                      Failed to load takes
                    </div>
                    <button
                      onClick={() => fetchFeed(activeTab)}
                      style={{
                        padding: "8px 24px",
                        borderRadius: "8px",
                        background: "#FF6B35",
                        color: "#fff",
                        border: "none",
                        fontWeight: "700",
                        fontSize: "13px",
                        fontFamily: "var(--font-barlow), sans-serif",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        cursor: "pointer",
                      }}
                    >
                      Retry
                    </button>
                  </div>
                ) : takes.length === 0 ? (
                  <div style={{
                    padding: "60px 20px",
                    textAlign: "center",
                  }}>
                    <div style={{
                      color: "rgba(255,255,255,0.5)",
                      fontFamily: "var(--font-barlow), sans-serif",
                      fontSize: "16px",
                      marginBottom: "8px",
                    }}>
                      {activeTab === "LIVE" ? "No live takes yet" : "No takes yet"}
                    </div>
                    <div style={{
                      color: "rgba(255,255,255,0.3)",
                      fontFamily: "var(--font-barlow), sans-serif",
                      fontSize: "14px",
                    }}>
                      {!session?.user
                        ? "Sign in to start the conversation."
                        : activeTab === "LIVE" && liveGames.length > 0
                        ? "Drop a take about a live game!"
                        : activeTab === "LIVE"
                        ? "No games are live right now. Check back during game time!"
                        : "Be the first to drop a take."}
                    </div>
                    {activeTab === "LIVE" && liveGames.length > 0 && session?.user && (
                      <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" }}>
                        {liveGames.map((game) => (
                          <button
                            key={game.id}
                            onClick={() => {
                              setReplyToId(null);
                              setComposeGameId(game.id);
                              setShowCompose(true);
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              padding: "10px 20px",
                              borderRadius: "8px",
                              background: "rgba(255,107,53,0.1)",
                              border: "1px solid rgba(255,107,53,0.3)",
                              color: "#fff",
                              fontFamily: "var(--font-barlow), sans-serif",
                              fontSize: "14px",
                              fontWeight: "600",
                              cursor: "pointer",
                            }}
                          >
                            <span>{game.awayTeam.abbreviation}</span>
                            <span style={{ color: "rgba(255,255,255,0.3)" }}>@</span>
                            <span>{game.homeTeam.abbreviation}</span>
                            <span style={{
                              color: "#FF6B35",
                              fontSize: "12px",
                              fontWeight: "700",
                              textTransform: "uppercase",
                              marginLeft: "6px",
                            }}>
                              Post Take
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  takes.map((take) => (
                    <TakeCard
                      key={take.id}
                      take={take}
                      currentUserId={(session?.user as { id?: string })?.id}
                      currentUserRole={(session?.user as { role?: string })?.role}
                      onReact={handleReact}
                      onBookmark={handleBookmark}
                      onRepost={handleRepost}
                      onDelete={handleDelete}
                      onPollVote={handlePollVote}
                      onReply={handleReply}
                    />
                  ))
                )}
              </div>

              {/* Load More */}
              {nextCursor && takes.length > 0 && (
                <div style={{ textAlign: "center", marginTop: "16px" }}>
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    style={{
                      padding: "10px 32px",
                      borderRadius: "8px",
                      background: "transparent",
                      border: "1px solid #FF6B35",
                      color: "#FF6B35",
                      fontWeight: "700",
                      fontSize: "13px",
                      fontFamily: "var(--font-barlow), sans-serif",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      cursor: loadingMore ? "not-allowed" : "pointer",
                      opacity: loadingMore ? 0.5 : 1,
                    }}
                  >
                    {loadingMore ? "Loading..." : "Load More"}
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside>
              {/* Live Scores */}
              {liveGames.length > 0 && (
                <div style={{
                  background: "#1A1A1A",
                  borderRadius: "12px",
                  border: "1px solid #2a2a2a",
                  padding: "20px",
                  marginBottom: "16px",
                }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "14px",
                  }}>
                    <h3 style={{
                      fontFamily: "var(--font-anton), Anton, sans-serif",
                      fontSize: "14px",
                      color: "#FF6B35",
                      margin: 0,
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                    }}>
                      Live Scores
                    </h3>
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "11px",
                      color: "#22c55e",
                      fontFamily: "var(--font-barlow), sans-serif",
                      fontWeight: 600,
                    }}>
                      <span style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "#22c55e",
                        display: "inline-block",
                        animation: "pulse 2s ease-in-out infinite",
                      }} />
                      LIVE
                    </span>
                  </div>
                  {liveGames.map((game) => (
                    <Link
                      key={game.id}
                      href="/scores"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 0",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        textDecoration: "none",
                        transition: "opacity 0.15s",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            {game.awayTeam.logoUrl && (
                              <img src={game.awayTeam.logoUrl} alt={game.awayTeam.abbreviation} style={{ width: 16, height: 16, objectFit: "contain" }} />
                            )}
                            <span style={{
                              fontFamily: "var(--font-barlow), sans-serif",
                              fontSize: "13px",
                              fontWeight: 600,
                              color: game.awayScore > game.homeScore ? "#fff" : "rgba(255,255,255,0.5)",
                            }}>
                              {game.awayTeam.abbreviation}
                            </span>
                          </div>
                          <span style={{
                            fontFamily: "var(--font-mono), monospace",
                            fontSize: "13px",
                            fontWeight: 700,
                            color: game.awayScore > game.homeScore ? "#fff" : "rgba(255,255,255,0.5)",
                          }}>
                            {game.awayScore}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            {game.homeTeam.logoUrl && (
                              <img src={game.homeTeam.logoUrl} alt={game.homeTeam.abbreviation} style={{ width: 16, height: 16, objectFit: "contain" }} />
                            )}
                            <span style={{
                              fontFamily: "var(--font-barlow), sans-serif",
                              fontSize: "13px",
                              fontWeight: 600,
                              color: game.homeScore > game.awayScore ? "#fff" : "rgba(255,255,255,0.5)",
                            }}>
                              {game.homeTeam.abbreviation}
                            </span>
                          </div>
                          <span style={{
                            fontFamily: "var(--font-mono), monospace",
                            fontSize: "13px",
                            fontWeight: 700,
                            color: game.homeScore > game.awayScore ? "#fff" : "rgba(255,255,255,0.5)",
                          }}>
                            {game.homeScore}
                          </span>
                        </div>
                      </div>
                      <div style={{ marginLeft: "12px", textAlign: "center", minWidth: "40px" }}>
                        <div style={{
                          fontFamily: "var(--font-barlow), sans-serif",
                          fontSize: "10px",
                          fontWeight: 700,
                          color: game.status === "live" ? "#22c55e" : "rgba(255,255,255,0.4)",
                          textTransform: "uppercase",
                        }}>
                          {game.status === "live" ? (game.quarter || "LIVE") : game.status === "final" ? "FINAL" : ""}
                        </div>
                        {game.clock && game.status === "live" && (
                          <div style={{
                            fontFamily: "var(--font-mono), monospace",
                            fontSize: "10px",
                            color: "rgba(255,255,255,0.5)",
                          }}>
                            {game.clock}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                  <Link
                    href="/scores"
                    style={{
                      display: "block",
                      textAlign: "center",
                      marginTop: "10px",
                      fontFamily: "var(--font-barlow), sans-serif",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#FF6B35",
                      textDecoration: "none",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    View All Scores
                  </Link>
                </div>
              )}

              {/* Latest News */}
              <div style={{
                background: "#1A1A1A",
                borderRadius: "12px",
                border: "1px solid #2a2a2a",
                padding: "20px",
                marginBottom: "16px",
              }}>
                <h3 style={{
                  fontFamily: "var(--font-anton), Anton, sans-serif",
                  fontSize: "14px",
                  color: "#FF6B35",
                  margin: "0 0 14px 0",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                }}>
                  Latest News
                </h3>
                {newsArticles.length === 0 ? (
                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px", fontFamily: "var(--font-barlow), sans-serif" }}>
                    Loading news...
                  </div>
                ) : (
                  <>
                    {newsArticles.map((article) => (
                      <a
                        key={article.id}
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex",
                          gap: "10px",
                          padding: "10px 0",
                          borderBottom: "1px solid rgba(255,255,255,0.05)",
                          textDecoration: "none",
                          color: "inherit",
                        }}
                      >
                        <div style={{
                          width: 56,
                          height: 56,
                          borderRadius: "8px",
                          overflow: "hidden",
                          flexShrink: 0,
                          background: "rgba(255,107,53,0.15)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}>
                          {article.imageUrl ? (
                            <img
                              src={article.imageUrl}
                              alt=""
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <span style={{
                              fontFamily: "var(--font-anton), Anton, sans-serif",
                              fontSize: "18px",
                              color: "#FF6B35",
                            }}>
                              {article.source.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontFamily: "var(--font-barlow), sans-serif",
                            fontSize: "13px",
                            fontWeight: "600",
                            color: "#fff",
                            lineHeight: "1.3",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}>
                            {article.title}
                          </div>
                          <div style={{
                            fontFamily: "var(--font-barlow), sans-serif",
                            fontSize: "11px",
                            color: "rgba(255,255,255,0.35)",
                            marginTop: "4px",
                          }}>
                            {article.source}
                          </div>
                        </div>
                      </a>
                    ))}
                    <Link
                      href="/news"
                      style={{
                        display: "block",
                        textAlign: "center",
                        marginTop: "12px",
                        fontFamily: "var(--font-barlow), sans-serif",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#FF6B35",
                        textDecoration: "none",
                      }}
                    >
                      More News &rarr;
                    </Link>
                  </>
                )}
              </div>

              {/* Who to Follow */}
              {suggestedUsers.length > 0 && (
                <div style={{
                  background: "#1A1A1A",
                  borderRadius: "12px",
                  border: "1px solid #2a2a2a",
                  padding: "20px",
                }}>
                  <h3 style={{
                    fontFamily: "var(--font-anton), Anton, sans-serif",
                    fontSize: "14px",
                    color: "#FF6B35",
                    margin: "0 0 14px 0",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                  }}>
                    Who to Follow
                  </h3>
                  {suggestedUsers.map((user) => (
                    <div
                      key={user.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 0",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "#FF6B35",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "13px",
                          fontWeight: "700",
                          color: "#fff",
                          overflow: "hidden",
                        }}>
                          {user.image
                            ? <img src={user.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : (user.name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontFamily: "var(--font-barlow), sans-serif", fontSize: "13px", fontWeight: "700", color: "#fff" }}>
                            {user.name}
                          </div>
                          <div style={{ fontFamily: "var(--font-barlow), sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>
                            {user.takeCount} takes
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleFollow(user.id)}
                        disabled={followLoading.has(user.id)}
                        style={{
                          padding: "4px 14px",
                          borderRadius: "6px",
                          border: followedIds.has(user.id) ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,107,53,0.4)",
                          background: followedIds.has(user.id) ? "rgba(255,255,255,0.1)" : "transparent",
                          color: followedIds.has(user.id) ? "rgba(255,255,255,0.6)" : "#FF6B35",
                          fontSize: "11px",
                          fontWeight: "700",
                          fontFamily: "var(--font-barlow), sans-serif",
                          cursor: followLoading.has(user.id) ? "wait" : "pointer",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          opacity: followLoading.has(user.id) ? 0.5 : 1,
                        }}
                      >
                        {followedIds.has(user.id) ? "Following" : "Follow"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </aside>
          </div>
        </div>

        {showCompose && (
          <ComposeTake
            onClose={() => { setShowCompose(false); setReplyToId(null); setComposeGameId(null); }}
            onSubmit={(data) => {
              if (replyToId) {
                // Reply: increment replyCount optimistically
                setTakes((prev) =>
                  prev.map((t) =>
                    t.id === replyToId ? { ...t, replyCount: t.replyCount + 1 } : t
                  )
                );
              } else {
                handleCompose(data);
              }
            }}
            parentId={replyToId || undefined}
            gameId={composeGameId || undefined}
          />
        )}

        <style>{`
          @media (max-width: 900px) {
            div[style*="gridTemplateColumns: 1fr 320px"] {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </main>
      <Footer />
    </>
  );
}
