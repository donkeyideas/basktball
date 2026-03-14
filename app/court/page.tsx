"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

  // Inline compose state
  const [composeContent, setComposeContent] = useState("");
  const [composeTags, setComposeTags] = useState<string[]>([]);
  const [composeTagInput, setComposeTagInput] = useState("");
  const [composeShowPoll, setComposeShowPoll] = useState(false);
  const [composePollOptions, setComposePollOptions] = useState<string[]>(["", ""]);
  const [composePollDuration, setComposePollDuration] = useState(24);
  const [composeSubmitting, setComposeSubmitting] = useState(false);
  const composeTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Modal state for Age and Challenge
  const [ageModal, setAgeModal] = useState<{ takeId: string; days: string } | null>(null);
  const [challengeModal, setChallengeModal] = useState<{ takeId: string; authorId: string; topic: string } | null>(null);
  const [statCheckLoading, setStatCheckLoading] = useState<string | null>(null);

  const composeCharCount = composeContent.length;
  const composeIsOverLimit = composeCharCount > 2000;
  const composeValidPollOptions = composePollOptions.filter((o) => o.trim().length > 0);
  const composePollValid = !composeShowPoll || composeValidPollOptions.length >= 2;
  const composeCanPost = composeContent.trim().length > 0 && !composeIsOverLimit && !composeSubmitting && composePollValid;

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

  // Stat Check handler
  const handleStatCheck = useCallback(async (takeId: string) => {
    setStatCheckLoading(takeId);
    try {
      const res = await fetch(`/api/court/takes/${takeId}/stat-check`, { method: "POST" });
      const data = await res.json();
      if (data.statCheck) {
        setTakes((prev) =>
          prev.map((t) => (t.id === takeId ? { ...t, statCheck: data.statCheck } : t))
        );
      }
    } catch {
      // silently fail
    } finally {
      setStatCheckLoading(null);
    }
  }, []);

  // Challenge handler — opens modal
  const handleChallenge = useCallback((_takeId: string, authorId: string) => {
    setChallengeModal({ takeId: _takeId, authorId, topic: "" });
  }, []);

  const submitChallenge = useCallback(async () => {
    if (!challengeModal || !challengeModal.topic.trim()) return;
    try {
      await fetch("/api/court/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: challengeModal.topic.trim(), challengedId: challengeModal.authorId }),
      });
    } catch {
      // silently fail
    }
    setChallengeModal(null);
  }, [challengeModal]);

  // Age handler — opens modal
  const handleAge = useCallback((takeId: string) => {
    setAgeModal({ takeId, days: "7" });
  }, []);

  const submitAge = useCallback(async () => {
    if (!ageModal) return;
    const days = parseInt(ageModal.days, 10);
    if (!days || days < 1) return;
    const revisitDate = new Date(Date.now() + days * 86400000).toISOString();
    try {
      const res = await fetch(`/api/court/takes/${ageModal.takeId}/age`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revisitDate }),
      });
      const data = await res.json();
      if (data.agingTake) {
        setTakes((prev) =>
          prev.map((t) => (t.id === ageModal.takeId ? { ...t, agingTake: data.agingTake } : t))
        );
      }
    } catch {
      // silently fail
    }
    setAgeModal(null);
  }, [ageModal]);

  // Add newly composed take to feed (ComposeTake already POSTed to API)
  const handleCompose = useCallback((data: Record<string, unknown>) => {
    if (data.take) {
      const take = data.take as Take;
      setTakes((prev) => [{ ...take, userReaction: null, userBookmarked: false, userReposted: false }, ...prev]);
    }
  }, []);

  // Inline compose handlers
  const handleComposeContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComposeContent(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = ta.scrollHeight + "px";
  }, []);

  const handleComposeTagKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        const raw = composeTagInput.trim().replace(/^#/, "").replace(/[^a-zA-Z0-9_]/g, "");
        if (raw.length > 0 && !composeTags.includes(raw) && composeTags.length < 5) {
          setComposeTags((prev) => [...prev, raw]);
        }
        setComposeTagInput("");
      } else if (e.key === "Backspace" && composeTagInput === "" && composeTags.length > 0) {
        setComposeTags((prev) => prev.slice(0, -1));
      }
    },
    [composeTagInput, composeTags]
  );

  const handleInlinePost = useCallback(async () => {
    if (!composeCanPost) return;
    setComposeSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        content: composeContent.trim(),
        tags: composeTags,
      };
      if (activeTab === "LIVE" && liveGames.length > 0) {
        body.gameId = liveGames[0].id;
      }
      if (composeShowPoll && composeValidPollOptions.length >= 2) {
        body.pollOptions = composeValidPollOptions.map((o) => o.trim());
        body.pollDuration = composePollDuration;
      }
      const res = await fetch("/api/court/takes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.take) {
          setTakes((prev) => [{ ...data.take, userReaction: null, userBookmarked: false, userReposted: false }, ...prev]);
        }
        setComposeContent("");
        setComposeTags([]);
        setComposeTagInput("");
        setComposeShowPoll(false);
        setComposePollOptions(["", ""]);
        if (composeTextareaRef.current) {
          composeTextareaRef.current.style.height = "auto";
        }
      }
    } catch (err) {
      console.error("Error posting take:", err);
    } finally {
      setComposeSubmitting(false);
    }
  }, [composeCanPost, composeContent, composeTags, activeTab, liveGames, composeShowPoll, composeValidPollOptions, composePollDuration]);

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
        <div style={{ maxWidth: "1440px", margin: "0 auto" }}>
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
              {!session?.user && (
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
          <div className="court-grid" style={{
            display: "grid",
            gridTemplateColumns: "260px 1fr 320px",
            gap: "28px",
            alignItems: "start",
          }}>
            {/* Features Sidebar */}
            <div className="court-features-sidebar" style={{ position: "sticky", top: "100px" }}>
              <div style={{
                background: "#1A1A1A",
                borderRadius: "12px",
                border: "1px solid #2a2a2a",
                padding: "20px",
              }}>
                <h3 style={{
                  fontFamily: "var(--font-anton), sans-serif",
                  fontSize: "16px",
                  color: "#FF6B35",
                  letterSpacing: "1px",
                  marginBottom: "16px",
                }}>COURT FEATURES</h3>

                {[
                  {
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-1.07-4.14 0-6 1.5 2 2 3.5 2 5.5a2.5 2.5 0 0 0 5 0c0-2.5-1-4-2-6 1 1.5 2 3.5 2 6s-1.5 5-4 6.5c-1 .6-2 1-3 1.5"/>
                      </svg>
                    ),
                    title: "Hot Streak",
                    desc: "Users earn fire or ice badges based on recent take performance. Updated every 4 hours.",
                  },
                  {
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
                        <path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>
                      </svg>
                    ),
                    title: "Receipts",
                    desc: "Post a prediction — AI auto-detects it. After the game, it's stamped RECEIPT or BUST.",
                  },
                  {
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/>
                      </svg>
                    ),
                    title: "Courtside",
                    desc: "Tag your takes with quarter and game clock during live games.",
                  },
                  {
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
                      </svg>
                    ),
                    title: "Stat Check",
                    desc: "Tap the magnifying glass to AI fact-check statistical claims on any take.",
                  },
                  {
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
                      </svg>
                    ),
                    title: "Challenge",
                    desc: "Tap the flag on someone's take to challenge them to a head-to-head debate.",
                  },
                  {
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                    ),
                    title: "Aging Takes",
                    desc: "Tap the clock icon to set a revisit date. The take resurfaces for re-evaluation.",
                  },
                ].map((feature, i) => (
                  <div key={i} style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "flex-start",
                    padding: "12px 0",
                    borderTop: i === 0 ? "none" : "1px solid #2a2a2a",
                  }}>
                    <div style={{ flexShrink: 0, marginTop: "2px" }}>{feature.icon}</div>
                    <div>
                      <div style={{
                        fontFamily: "var(--font-barlow), sans-serif",
                        fontWeight: 700,
                        fontSize: "13px",
                        color: "white",
                        marginBottom: "3px",
                      }}>{feature.title}</div>
                      <div style={{
                        fontFamily: "var(--font-barlow), sans-serif",
                        fontSize: "12px",
                        color: "rgba(255,255,255,0.45)",
                        lineHeight: "1.4",
                      }}>{feature.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

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

              {/* Inline Compose Box */}
              {session?.user && (
                <div style={{
                  background: "#1A1A1A",
                  border: "1px solid #2a2a2a",
                  borderTop: "none",
                  padding: "16px",
                }}>
                  <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      backgroundColor: "#FF6B35",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      overflow: "hidden",
                      fontFamily: "var(--font-anton), sans-serif",
                      fontSize: "16px",
                      color: "#fff",
                    }}>
                      {session.user.image ? (
                        <img src={session.user.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                      ) : (
                        (session.user.name || "?").charAt(0).toUpperCase()
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <textarea
                        ref={composeTextareaRef}
                        value={composeContent}
                        onChange={handleComposeContentChange}
                        placeholder="What's your take?"
                        maxLength={2010}
                        style={{
                          width: "100%",
                          fontFamily: "var(--font-barlow), sans-serif",
                          fontSize: "15px",
                          lineHeight: 1.45,
                          color: "rgba(255,255,255,0.9)",
                          backgroundColor: "transparent",
                          border: "none",
                          outline: "none",
                          resize: "none",
                          minHeight: "48px",
                          maxHeight: "200px",
                          overflow: "auto",
                        }}
                      />
                    </div>
                  </div>

                  {/* Poll Creation UI */}
                  {composeShowPoll && (
                    <div style={{ padding: "12px 0 0 52px" }}>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "10px",
                      }}>
                        <span style={{
                          fontFamily: "var(--font-barlow), sans-serif",
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#FF6B35",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}>
                          Poll Options
                        </span>
                        <button
                          type="button"
                          onClick={() => { setComposeShowPoll(false); setComposePollOptions(["", ""]); }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "rgba(255,255,255,0.4)",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontFamily: "var(--font-barlow), sans-serif",
                            fontWeight: 600,
                          }}
                        >
                          Remove Poll
                        </button>
                      </div>
                      {composePollOptions.map((opt, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const updated = [...composePollOptions];
                              updated[i] = e.target.value;
                              setComposePollOptions(updated);
                            }}
                            placeholder={`Option ${i + 1}${i < 2 ? " (required)" : ""}`}
                            maxLength={80}
                            style={{
                              flex: 1,
                              padding: "8px 12px",
                              borderRadius: "8px",
                              border: "1px solid rgba(255,255,255,0.12)",
                              background: "rgba(255,255,255,0.04)",
                              color: "rgba(255,255,255,0.85)",
                              fontFamily: "var(--font-barlow), sans-serif",
                              fontSize: "13px",
                              outline: "none",
                            }}
                          />
                          {i >= 2 && (
                            <button
                              type="button"
                              onClick={() => setComposePollOptions((prev) => prev.filter((_, j) => j !== i))}
                              style={{
                                background: "none",
                                border: "none",
                                color: "rgba(255,255,255,0.3)",
                                cursor: "pointer",
                                fontSize: "16px",
                                lineHeight: 1,
                                padding: "4px",
                              }}
                            >
                              &times;
                            </button>
                          )}
                        </div>
                      ))}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px" }}>
                        {composePollOptions.length < 4 && (
                          <button
                            type="button"
                            onClick={() => setComposePollOptions((prev) => [...prev, ""])}
                            style={{
                              background: "none",
                              border: "1px solid rgba(255,107,53,0.3)",
                              color: "#FF6B35",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontFamily: "var(--font-barlow), sans-serif",
                              fontWeight: 600,
                              padding: "4px 12px",
                              borderRadius: "6px",
                              textTransform: "uppercase",
                              letterSpacing: "0.3px",
                            }}
                          >
                            + Add Option
                          </button>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" }}>
                          <span style={{
                            fontFamily: "var(--font-barlow), sans-serif",
                            fontSize: "12px",
                            color: "rgba(255,255,255,0.4)",
                          }}>
                            Duration:
                          </span>
                          <select
                            value={composePollDuration}
                            onChange={(e) => setComposePollDuration(Number(e.target.value))}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              border: "1px solid rgba(255,255,255,0.12)",
                              background: "#1A1A1A",
                              color: "rgba(255,255,255,0.7)",
                              fontFamily: "var(--font-barlow), sans-serif",
                              fontSize: "12px",
                              outline: "none",
                              cursor: "pointer",
                            }}
                          >
                            <option value={1}>1 hour</option>
                            <option value={6}>6 hours</option>
                            <option value={12}>12 hours</option>
                            <option value={24}>1 day</option>
                            <option value={72}>3 days</option>
                            <option value={168}>7 days</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Footer: tags, poll toggle, char count, post button */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: "10px",
                    paddingLeft: "52px",
                    flexWrap: "wrap",
                  }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      flexWrap: "wrap",
                      flex: 1,
                    }}>
                      {composeTags.map((tag) => (
                        <span key={tag} style={{
                          fontFamily: "var(--font-barlow), sans-serif",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#FF6B35",
                          backgroundColor: "rgba(255,107,53,0.12)",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          lineHeight: 1.5,
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          textTransform: "uppercase",
                        }}>
                          #{tag}
                          <button
                            type="button"
                            onClick={() => setComposeTags((prev) => prev.filter((t) => t !== tag))}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#FF6B35",
                              cursor: "pointer",
                              padding: "0",
                              fontSize: "13px",
                              lineHeight: 1,
                              fontWeight: 700,
                            }}
                          >
                            x
                          </button>
                        </span>
                      ))}
                      {composeTags.length < 5 && (
                        <input
                          type="text"
                          placeholder="#tag"
                          value={composeTagInput}
                          onChange={(e) => setComposeTagInput(e.target.value)}
                          onKeyDown={handleComposeTagKeyDown}
                          style={{
                            fontFamily: "var(--font-barlow), sans-serif",
                            fontSize: "12px",
                            color: "rgba(255,255,255,0.6)",
                            backgroundColor: "transparent",
                            border: "none",
                            outline: "none",
                            width: "80px",
                          }}
                        />
                      )}
                    </div>
                    {!composeShowPoll && (
                      <button
                        type="button"
                        onClick={() => setComposeShowPoll(true)}
                        style={{
                          background: "none",
                          border: "1px solid rgba(255,107,53,0.3)",
                          color: "#FF6B35",
                          cursor: "pointer",
                          fontSize: "11px",
                          fontFamily: "var(--font-barlow), sans-serif",
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: "6px",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                          flexShrink: 0,
                        }}
                      >
                        + Poll
                      </button>
                    )}
                    <span style={{
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: "12px",
                      fontWeight: 500,
                      color: composeIsOverLimit
                        ? "#EF4444"
                        : composeCharCount > 1900
                        ? "#F59E0B"
                        : "rgba(255,255,255,0.35)",
                      flexShrink: 0,
                    }}>
                      {composeCharCount}/2000
                    </span>
                    <button
                      onClick={handleInlinePost}
                      disabled={!composeCanPost}
                      style={{
                        padding: "6px 20px",
                        borderRadius: "20px",
                        background: composeCanPost ? "#FF6B35" : "rgba(255,107,53,0.2)",
                        color: composeCanPost ? "#fff" : "rgba(255,255,255,0.3)",
                        border: "none",
                        fontWeight: "700",
                        fontSize: "13px",
                        fontFamily: "var(--font-barlow), sans-serif",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        cursor: composeCanPost ? "pointer" : "not-allowed",
                        flexShrink: 0,
                      }}
                    >
                      {composeSubmitting ? "Posting..." : "Post"}
                    </button>
                  </div>
                </div>
              )}

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
                      onStatCheck={handleStatCheck}
                      onChallenge={handleChallenge}
                      onAge={handleAge}
                      statCheckLoading={statCheckLoading}
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

        {showCompose && replyToId && (
          <ComposeTake
            onClose={() => { setShowCompose(false); setReplyToId(null); setComposeGameId(null); }}
            onSubmit={() => {
              setTakes((prev) =>
                prev.map((t) =>
                  t.id === replyToId ? { ...t, replyCount: t.replyCount + 1 } : t
                )
              );
            }}
            parentId={replyToId}
            gameId={composeGameId || undefined}
          />
        )}

        <style>{`
          @media (max-width: 1100px) {
            .court-features-sidebar { display: none !important; }
            .court-grid { grid-template-columns: 1fr 320px !important; }
          }
          @media (max-width: 768px) {
            .court-grid { grid-template-columns: 1fr !important; }
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>

        {/* Age Take Modal */}
        {ageModal && (
          <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={() => setAgeModal(null)}>
            <div
              style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "400px", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontFamily: "var(--font-anton), sans-serif", fontSize: "18px", color: "white", marginBottom: "6px" }}>AGE THIS TAKE</h3>
              <p style={{ fontFamily: "var(--font-barlow), sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "20px" }}>Set a revisit date. This take will resurface for the community to re-evaluate.</p>
              <label style={{ fontFamily: "var(--font-barlow), sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.6)", display: "block", marginBottom: "8px" }}>Revisit in how many days?</label>
              <input
                type="number"
                min="1"
                max="365"
                value={ageModal.days}
                onChange={(e) => setAgeModal({ ...ageModal, days: e.target.value })}
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") submitAge(); }}
                style={{ width: "100%", padding: "10px 14px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: "white", fontSize: "16px", fontFamily: "var(--font-barlow), sans-serif" }}
              />
              <div style={{ display: "flex", gap: "10px", marginTop: "20px", justifyContent: "flex-end" }}>
                <button onClick={() => setAgeModal(null)} style={{ padding: "8px 20px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: "13px", fontFamily: "var(--font-barlow), sans-serif", fontWeight: 600 }}>Cancel</button>
                <button onClick={submitAge} disabled={!ageModal.days || parseInt(ageModal.days) < 1} style={{ padding: "8px 20px", background: "#FF6B35", border: "none", borderRadius: "8px", color: "black", cursor: "pointer", fontSize: "13px", fontFamily: "var(--font-barlow), sans-serif", fontWeight: 700, opacity: !ageModal.days || parseInt(ageModal.days) < 1 ? 0.5 : 1 }}>Age It</button>
              </div>
            </div>
          </div>
        )}

        {/* Challenge Modal */}
        {challengeModal && (
          <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={() => setChallengeModal(null)}>
            <div
              style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "440px", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontFamily: "var(--font-anton), sans-serif", fontSize: "18px", color: "white", marginBottom: "6px" }}>CHALLENGE</h3>
              <p style={{ fontFamily: "var(--font-barlow), sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "20px" }}>Challenge this user to a head-to-head debate. The community votes on who wins.</p>
              <label style={{ fontFamily: "var(--font-barlow), sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.6)", display: "block", marginBottom: "8px" }}>What&apos;s the debate topic?</label>
              <input
                type="text"
                value={challengeModal.topic}
                onChange={(e) => setChallengeModal({ ...challengeModal, topic: e.target.value })}
                placeholder="e.g. LeBron vs Jordan, Best PG in the league..."
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") submitChallenge(); }}
                style={{ width: "100%", padding: "10px 14px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: "white", fontSize: "14px", fontFamily: "var(--font-barlow), sans-serif" }}
              />
              <div style={{ display: "flex", gap: "10px", marginTop: "20px", justifyContent: "flex-end" }}>
                <button onClick={() => setChallengeModal(null)} style={{ padding: "8px 20px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: "13px", fontFamily: "var(--font-barlow), sans-serif", fontWeight: 600 }}>Cancel</button>
                <button onClick={submitChallenge} disabled={!challengeModal.topic.trim()} style={{ padding: "8px 20px", background: "#FF6B35", border: "none", borderRadius: "8px", color: "black", cursor: "pointer", fontSize: "13px", fontFamily: "var(--font-barlow), sans-serif", fontWeight: 700, opacity: !challengeModal.topic.trim() ? 0.5 : 1 }}>Send Challenge</button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
