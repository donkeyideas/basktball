"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Header, Footer } from "@/components";
import TakeCard from "@/components/court/TakeCard";
import type { Take } from "@/components/court/TakeCard";
import ComposeTake from "@/components/court/ComposeTake";

export default function TakeDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const takeId = params?.id as string;

  const [mainTake, setMainTake] = useState<Take | null>(null);
  const [replies, setReplies] = useState<Take[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCompose, setShowCompose] = useState(false);

  // Fetch take detail from API
  useEffect(() => {
    if (!takeId) return;
    setLoading(true);
    setError(null);

    fetch(`/api/court/takes/${takeId}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? "Take not found" : "Failed to load");
        return res.json();
      })
      .then((data) => {
        const t = data.take;
        setMainTake({
          id: t.id,
          content: t.content,
          author: t.author,
          createdAt: t.createdAt,
          fireCount: t.fireCount,
          brickCount: t.brickCount,
          replyCount: t.replyCount,
          repostCount: t.repostCount,
          tags: t.tags || [],
          gameId: t.gameId,
          parentId: t.parentId,
          userReaction: t.reactions?.[0]?.type || null,
          userBookmarked: (t.bookmarks?.length || 0) > 0,
          userReposted: (t.reposts?.length || 0) > 0,
          poll: t.poll || null,
        });
        setReplies(
          (t.replies || []).map((r: Record<string, unknown>) => ({
            id: r.id as string,
            content: r.content as string,
            author: r.author as Take["author"],
            createdAt: r.createdAt as string,
            fireCount: (r.fireCount as number) || 0,
            brickCount: (r.brickCount as number) || 0,
            replyCount: (r.replyCount as number) || 0,
            repostCount: (r.repostCount as number) || 0,
            tags: (r.tags as string[]) || [],
            gameId: (r.gameId as string) || null,
            parentId: (r.parentId as string) || null,
            userReaction: ((r.reactions as { type: string }[])?.[0]?.type as string) || null,
            userBookmarked: ((r.bookmarks as unknown[])?.length || 0) > 0,
            userReposted: false,
          }))
        );
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [takeId]);

  const handleReact = useCallback(
    async (targetId: string, reaction: "FIRE" | "BRICK") => {
      // Optimistic update
      const updater = (t: Take): Take => {
        if (t.id !== targetId) return t;
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
      };

      if (targetId === mainTake?.id) {
        setMainTake((t) => (t ? updater(t) : t));
      } else {
        setReplies((prev) => prev.map(updater));
      }

      try {
        await fetch(`/api/court/takes/${targetId}/react`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: reaction }),
        });
      } catch {
        // Revert on error by re-fetching
      }
    },
    [mainTake?.id]
  );

  const handleBookmark = useCallback(
    async (targetId: string) => {
      if (targetId === mainTake?.id) {
        setMainTake((t) => (t ? { ...t, userBookmarked: !t.userBookmarked } : t));
      } else {
        setReplies((prev) =>
          prev.map((t) => (t.id === targetId ? { ...t, userBookmarked: !t.userBookmarked } : t))
        );
      }

      try {
        await fetch(`/api/court/takes/${targetId}/bookmark`, { method: "POST" });
      } catch {
        // Revert on error
      }
    },
    [mainTake?.id]
  );

  const handleRepost = useCallback(
    async (targetId: string) => {
      const updater = (t: Take): Take =>
        t.id === targetId
          ? { ...t, userReposted: !t.userReposted, repostCount: t.repostCount + (t.userReposted ? -1 : 1) }
          : t;

      if (targetId === mainTake?.id) {
        setMainTake((t) => (t ? updater(t) : t));
      } else {
        setReplies((prev) => prev.map(updater));
      }

      try {
        await fetch(`/api/court/takes/${targetId}/repost`, { method: "POST" });
      } catch {
        // Revert on error
      }
    },
    [mainTake?.id]
  );

  const handlePollVote = useCallback(
    async (targetId: string, optionId: string) => {
      // Optimistic update
      const updater = (t: Take): Take => {
        if (t.id !== targetId || !t.poll) return t;
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
      };

      if (targetId === mainTake?.id) {
        setMainTake((t) => (t ? updater(t) : t));
      } else {
        setReplies((prev) => prev.map(updater));
      }

      try {
        await fetch(`/api/court/takes/${targetId}/poll`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ optionId }),
        });
      } catch {
        // Revert on error
      }
    },
    [mainTake?.id]
  );

  const handleDelete = useCallback(
    async (targetId: string) => {
      // If deleting the main take, redirect back to court
      if (targetId === mainTake?.id) {
        try {
          await fetch(`/api/court/takes/${targetId}`, { method: "DELETE" });
        } catch { /* ignore */ }
        window.location.href = "/court";
        return;
      }
      // Otherwise remove reply from list
      setReplies((prev) => prev.filter((t) => t.id !== targetId));
      setMainTake((t) => (t ? { ...t, replyCount: t.replyCount - 1 } : t));
      try {
        await fetch(`/api/court/takes/${targetId}`, { method: "DELETE" });
      } catch { /* ignore */ }
    },
    [mainTake?.id]
  );

  const handleComposeReply = useCallback(
    (data: { content: string; tags: string[] }) => {
      const newReply: Take = {
        id: `reply-new-${Date.now()}`,
        content: data.content,
        author: {
          id: (session?.user as { id?: string })?.id || "me",
          name: session?.user?.name || "You",
          displayName: session?.user?.name || "You",
          image: session?.user?.image || null,
          avatarUrl: null,
        },
        createdAt: new Date().toISOString(),
        fireCount: 0,
        brickCount: 0,
        replyCount: 0,
        repostCount: 0,
        tags: data.tags,
        gameId: null,
        parentId: takeId,
        userReaction: null,
        userBookmarked: false,
        userReposted: false,
      };
      setReplies((prev) => [...prev, newReply]);
      setMainTake((t) => (t ? { ...t, replyCount: t.replyCount + 1 } : t));
    },
    [session, takeId]
  );

  // Loading state
  if (loading) {
    return (
      <>
        <Header />
        <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
          <div style={{ maxWidth: "700px", margin: "0 auto" }}>
            <Link
              href="/court"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                color: "rgba(255,255,255,0.5)",
                textDecoration: "none",
                fontFamily: "var(--font-barlow), sans-serif",
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "20px",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to The Court
            </Link>
            {[1, 2].map((i) => (
              <div
                key={i}
                style={{
                  background: "#1A1A1A",
                  borderRadius: "12px",
                  border: "1px solid #2a2a2a",
                  padding: "24px",
                  marginBottom: "4px",
                }}
              >
                <div
                  style={{
                    height: "48px",
                    width: "200px",
                    backgroundColor: "rgba(255,255,255,0.05)",
                    borderRadius: "8px",
                    marginBottom: "16px",
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                />
                <div
                  style={{
                    height: "60px",
                    backgroundColor: "rgba(255,255,255,0.05)",
                    borderRadius: "8px",
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                />
              </div>
            ))}
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Error state
  if (error || !mainTake) {
    return (
      <>
        <Header />
        <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
          <div style={{ maxWidth: "700px", margin: "0 auto", textAlign: "center" }}>
            <Link
              href="/court"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                color: "rgba(255,255,255,0.5)",
                textDecoration: "none",
                fontFamily: "var(--font-barlow), sans-serif",
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "40px",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to The Court
            </Link>
            <div
              style={{
                background: "#1A1A1A",
                borderRadius: "12px",
                border: "1px solid #2a2a2a",
                padding: "40px 20px",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-barlow), sans-serif",
                  fontSize: "16px",
                  color: "rgba(255,255,255,0.5)",
                  margin: 0,
                }}
              >
                {error || "Take not found"}
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const fullTimestamp = new Date(mainTake.createdAt).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const authorName = mainTake.author.displayName || mainTake.author.name || "Anonymous";
  const avatarSrc = mainTake.author.avatarUrl || mainTake.author.image;

  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          {/* Back link */}
          <Link
            href="/court"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "rgba(255,255,255,0.5)",
              textDecoration: "none",
              fontFamily: "var(--font-barlow), sans-serif",
              fontSize: "14px",
              fontWeight: "600",
              marginBottom: "20px",
              transition: "color 0.15s ease",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to The Court
          </Link>

          {/* Main Take (Featured) */}
          <div
            style={{
              background: "#1A1A1A",
              borderRadius: "12px",
              border: "1px solid #2a2a2a",
              padding: "24px",
              marginBottom: "4px",
            }}
          >
            {/* Author Row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "18px",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "#FF6B35",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#fff",
                  flexShrink: 0,
                  overflow: "hidden",
                  fontFamily: "var(--font-barlow), sans-serif",
                }}
              >
                {avatarSrc ? (
                  <img src={avatarSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  authorName.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-barlow), sans-serif",
                    fontWeight: "700",
                    fontSize: "16px",
                    color: "#fff",
                  }}
                >
                  {authorName}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-barlow), sans-serif",
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.35)",
                  }}
                >
                  @{mainTake.author.name}
                </div>
              </div>
            </div>

            {/* Content */}
            <p
              style={{
                color: "#fff",
                fontFamily: "var(--font-barlow), sans-serif",
                fontSize: "20px",
                lineHeight: "1.5",
                margin: "0 0 16px 0",
                wordBreak: "break-word",
              }}
            >
              {mainTake.content}
            </p>

            {/* Tags */}
            {mainTake.tags && mainTake.tags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
                {mainTake.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: "12px",
                      padding: "3px 10px",
                      borderRadius: "10px",
                      background: "rgba(255,107,53,0.12)",
                      color: "#FF6B35",
                      fontFamily: "var(--font-barlow), sans-serif",
                      fontWeight: "600",
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Full Timestamp */}
            <div
              style={{
                fontFamily: "var(--font-barlow), sans-serif",
                fontSize: "13px",
                color: "rgba(255,255,255,0.3)",
                marginBottom: "16px",
                paddingBottom: "14px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {fullTimestamp}
            </div>

            {/* Engagement Stats */}
            <div
              style={{
                display: "flex",
                gap: "24px",
                paddingBottom: "14px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                marginBottom: "12px",
              }}
            >
              {[
                { count: mainTake.fireCount, label: "Fires" },
                { count: mainTake.brickCount, label: "Bricks" },
                { count: mainTake.repostCount, label: "Reposts" },
                { count: mainTake.replyCount, label: "Replies" },
              ].map(({ count, label }) => (
                <div key={label} style={{ display: "flex", gap: "4px", alignItems: "baseline" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-barlow), sans-serif",
                      fontWeight: "700",
                      fontSize: "15px",
                      color: "#fff",
                    }}
                  >
                    {count}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-barlow), sans-serif",
                      fontSize: "13px",
                      color: "rgba(255,255,255,0.35)",
                    }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-around",
              }}
            >
              <button
                onClick={() => handleReact(mainTake.id, "FIRE")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "none",
                  border: "none",
                  color: mainTake.userReaction === "FIRE" ? "#FF6B35" : "rgba(255,255,255,0.4)",
                  fontSize: "14px",
                  fontFamily: "var(--font-barlow), sans-serif",
                  fontWeight: "600",
                  cursor: "pointer",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  transition: "all 0.15s ease",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill={mainTake.userReaction === "FIRE" ? "#FF6B35" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 12c2-2.96 0-7-1-8 0 3.04-4 6.5-4 8s2.05 4 5 4 5-2 5-4c0-2-2-3-3-3-1 2-2 3-2 3z" />
                </svg>
                Fire
              </button>
              <button
                onClick={() => handleReact(mainTake.id, "BRICK")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "none",
                  border: "none",
                  color: mainTake.userReaction === "BRICK" ? "#EF4444" : "rgba(255,255,255,0.4)",
                  fontSize: "14px",
                  fontFamily: "var(--font-barlow), sans-serif",
                  fontWeight: "600",
                  cursor: "pointer",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  transition: "all 0.15s ease",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="6" width="18" height="5" rx="1" />
                  <rect x="3" y="13" width="8" height="5" rx="1" />
                  <rect x="13" y="13" width="8" height="5" rx="1" />
                </svg>
                Brick
              </button>
              <button
                onClick={() => handleRepost(mainTake.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "none",
                  border: "none",
                  color: mainTake.userReposted ? "#22c55e" : "rgba(255,255,255,0.4)",
                  fontSize: "14px",
                  fontFamily: "var(--font-barlow), sans-serif",
                  fontWeight: "600",
                  cursor: "pointer",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  transition: "all 0.15s ease",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="17 1 21 5 17 9" />
                  <path d="M3 11V9a4 4 0 014-4h14" />
                  <polyline points="7 23 3 19 7 15" />
                  <path d="M21 13v2a4 4 0 01-4 4H3" />
                </svg>
                Repost
              </button>
              <button
                onClick={() => handleBookmark(mainTake.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "none",
                  border: "none",
                  color: mainTake.userBookmarked ? "#FF6B35" : "rgba(255,255,255,0.4)",
                  fontSize: "14px",
                  fontFamily: "var(--font-barlow), sans-serif",
                  fontWeight: "600",
                  cursor: "pointer",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  transition: "all 0.15s ease",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill={mainTake.userBookmarked ? "#FF6B35" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                </svg>
                Save
              </button>

              {/* Delete button for owner/admin */}
              {((session?.user as { id?: string })?.id === mainTake.author.id ||
                (session?.user as { role?: string })?.role === "ADMIN" ||
                (session?.user as { role?: string })?.role === "MODERATOR") && (
                <button
                  onClick={() => {
                    if (window.confirm("Delete this take? This cannot be undone.")) {
                      handleDelete(mainTake.id);
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.3)",
                    fontSize: "14px",
                    fontFamily: "var(--font-barlow), sans-serif",
                    fontWeight: "600",
                    cursor: "pointer",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    transition: "color 0.15s ease",
                  }}
                  onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "#EF4444"; }}
                  onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "rgba(255,255,255,0.3)"; }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-2 14H7L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M9 6V4h6v2" />
                  </svg>
                  Delete
                </button>
              )}
            </div>
          </div>

          {/* Replies Section */}
          <div
            style={{
              background: "#1A1A1A",
              borderRadius: "12px",
              border: "1px solid #2a2a2a",
              overflow: "hidden",
              marginBottom: "20px",
            }}
          >
            {/* Replies Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-anton), Anton, sans-serif",
                  fontSize: "16px",
                  color: "#fff",
                  margin: 0,
                  letterSpacing: "1px",
                }}
              >
                REPLIES ({replies.length})
              </h2>
            </div>

            {/* Reply List */}
            {replies.length === 0 ? (
              <div
                style={{
                  padding: "40px 20px",
                  textAlign: "center",
                  color: "rgba(255,255,255,0.35)",
                  fontFamily: "var(--font-barlow), sans-serif",
                  fontSize: "14px",
                }}
              >
                No replies yet. Be the first to respond.
              </div>
            ) : (
              replies.map((reply) => (
                <TakeCard
                  key={reply.id}
                  take={reply}
                  currentUserId={(session?.user as { id?: string })?.id}
                  currentUserRole={(session?.user as { role?: string })?.role}
                  onReact={handleReact}
                  onBookmark={handleBookmark}
                  onRepost={handleRepost}
                  onDelete={handleDelete}
                  onPollVote={handlePollVote}
                />
              ))
            )}
          </div>

          {/* Compose Reply (inline) */}
          {session?.user ? (
            <div
              style={{
                background: "#1A1A1A",
                borderRadius: "12px",
                border: "1px solid #2a2a2a",
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                cursor: "pointer",
              }}
              onClick={() => setShowCompose(true)}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "#FF6B35",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "#fff",
                  flexShrink: 0,
                  overflow: "hidden",
                  fontFamily: "var(--font-barlow), sans-serif",
                }}
              >
                {session.user.image ? (
                  <img src={session.user.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  (session.user.name || "U").charAt(0).toUpperCase()
                )}
              </div>
              <span
                style={{
                  fontFamily: "var(--font-barlow), sans-serif",
                  fontSize: "14px",
                  color: "rgba(255,255,255,0.35)",
                }}
              >
                Drop your reply...
              </span>
            </div>
          ) : (
            <div
              style={{
                background: "#1A1A1A",
                borderRadius: "12px",
                border: "1px solid #2a2a2a",
                padding: "20px",
                textAlign: "center",
              }}
            >
              <Link
                href="/login"
                style={{
                  color: "#FF6B35",
                  textDecoration: "none",
                  fontFamily: "var(--font-barlow), sans-serif",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Sign in to reply
              </Link>
            </div>
          )}
        </div>

        {/* Compose Reply Modal */}
        {showCompose && (
          <ComposeTake onClose={() => setShowCompose(false)} onSubmit={handleComposeReply} parentId={takeId} />
        )}
      </main>
      <Footer />
    </>
  );
}
