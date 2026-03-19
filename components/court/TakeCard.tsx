"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// --- Types ---

interface TakeAuthor {
  id: string;
  name: string;
  displayName: string | null;
  image?: string | null;
  avatarUrl?: string | null;
  role?: string;
  streakType?: "HOT" | "COLD" | "NEUTRAL";
  streakCount?: number;
}

interface TakePrediction {
  status: "PENDING" | "RECEIPT" | "BUST" | "UNRESOLVABLE";
  claim: string;
  result?: string | null;
}

interface TakeStatCheck {
  overallStatus: "VERIFIED" | "FALSE" | "UNVERIFIABLE" | "PENDING";
  claims: unknown;
}

interface TakeAgingInfo {
  revisitDate: string;
  status: "AGING" | "AGED" | "EXPIRED";
  resurfacedAt?: string | null;
}

export interface PollOption {
  id: string;
  text: string;
  voteCount: number;
  position: number;
}

export interface TakePoll {
  id: string;
  totalVotes: number;
  endsAt: string | null;
  options: PollOption[];
  votes?: { optionId: string }[];
}

export interface Take {
  id: string;
  content: string;
  author: TakeAuthor;
  createdAt: string;
  fireCount: number;
  brickCount: number;
  replyCount: number;
  repostCount: number;
  viewCount?: number;
  tags: string[];
  gameId?: string | null;
  parentId?: string | null;
  quarter?: string | null;
  gameClock?: string | null;
  userReaction: "FIRE" | "BRICK" | null;
  userBookmarked: boolean;
  userReposted: boolean;
  poll?: TakePoll | null;
  prediction?: TakePrediction | null;
  statCheck?: TakeStatCheck | null;
  agingTake?: TakeAgingInfo | null;
}

interface TakeCardProps {
  take: Take;
  currentUserId?: string | null;
  currentUserRole?: string | null;
  onReact?: (takeId: string, reaction: "FIRE" | "BRICK") => void;
  onBookmark?: (takeId: string) => void;
  onRepost?: (takeId: string) => void;
  onDelete?: (takeId: string) => void;
  onPollVote?: (takeId: string, optionId: string) => void;
  onReply?: (takeId: string) => void;
  onStatCheck?: (takeId: string) => void;
  onChallenge?: (takeId: string, authorId: string) => void;
  onAge?: (takeId: string) => void;
  statCheckLoading?: string | null;
}

// --- Helpers ---

function getTimeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDay < 30) return `${diffDay}d`;
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getInitial(name: string): string {
  return (name?.charAt(0) || "?").toUpperCase();
}

// --- Icon SVGs ---

function FireIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={active ? "#FF6B35" : "none"}
      stroke={active ? "#FF6B35" : "rgba(255,255,255,0.4)"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 12c2-2.96 0-7-1-8 0 3.04-4 6.5-4 8s2.05 4 5 4 5-2 5-4c0-2-2-3-3-3-1 2-2 3-2 3z" />
    </svg>
  );
}

function BrickIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "#FF6B35" : "rgba(255,255,255,0.4)"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="6" width="18" height="5" rx="1" />
      <rect x="3" y="13" width="8" height="5" rx="1" />
      <rect x="13" y="13" width="8" height="5" rx="1" />
    </svg>
  );
}

function ReplyIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(255,255,255,0.4)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </svg>
  );
}

function RepostIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "#22C55E" : "rgba(255,255,255,0.4)"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 014-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 01-4 4H3" />
    </svg>
  );
}

function BookmarkIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={active ? "#FF6B35" : "none"}
      stroke={active ? "#FF6B35" : "rgba(255,255,255,0.4)"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
    </svg>
  );
}

// --- Component ---

export default function TakeCard({ take, currentUserId, currentUserRole, onReact, onBookmark, onRepost, onDelete, onPollVote, onReply, onStatCheck, onChallenge, onAge, statCheckLoading }: TakeCardProps) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [votingOptionId, setVotingOptionId] = useState<string | null>(null);
  const [showStatCheckDetails, setShowStatCheckDetails] = useState(false);

  const canDelete = currentUserId === take.author.id || currentUserRole === "ADMIN" || currentUserRole === "MODERATOR";

  const avatarSrc = take.author.avatarUrl || take.author.image || null;

  const handleReact = useCallback(
    (e: React.MouseEvent, reaction: "FIRE" | "BRICK") => {
      e.preventDefault();
      e.stopPropagation();
      onReact?.(take.id, reaction);
    },
    [onReact, take.id]
  );

  const handleBookmark = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onBookmark?.(take.id);
    },
    [onBookmark, take.id]
  );

  const handleRepost = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onRepost?.(take.id);
    },
    [onRepost, take.id]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.confirm("Delete this take? This cannot be undone.")) {
        onDelete?.(take.id);
      }
      setShowMenu(false);
    },
    [onDelete, take.id]
  );

  const handleReply = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onReply?.(take.id);
    },
    [onReply, take.id]
  );

  const handlePollVote = useCallback(
    (e: React.MouseEvent, optionId: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (votingOptionId) return;
      setVotingOptionId(optionId);
      onPollVote?.(take.id, optionId);
      // Reset voting state after a short delay
      setTimeout(() => setVotingOptionId(null), 1000);
    },
    [onPollVote, take.id, votingOptionId]
  );

  const toggleMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setShowMenu((prev) => !prev);
    },
    []
  );

  // --- Styles ---

  const cardStyle: React.CSSProperties = {
    display: "block",
    padding: "16px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    borderLeft: "2px solid transparent",
    borderRight: "none",
    borderTop: "none",
    backgroundColor: hovered ? "rgba(255,255,255,0.02)" : "transparent",
    borderLeftColor: hovered ? "#FF6B35" : "transparent",
    transition: "background-color 0.15s ease, border-color 0.15s ease",
    textDecoration: "none",
    cursor: "pointer",
  };

  const headerRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    marginBottom: "8px",
  };

  const avatarStyle: React.CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: "50%",
    backgroundColor: "#FF6B35",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
    fontFamily: "var(--font-anton), sans-serif",
    fontSize: "16px",
    color: "#FFFFFF",
    lineHeight: 1,
  };

  const avatarImgStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: "50%",
  };

  const metaStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap",
  };

  const displayNameStyle: React.CSSProperties = {
    fontFamily: "var(--font-inter), sans-serif",
    fontWeight: 700,
    fontSize: "14px",
    color: "#FFFFFF",
    lineHeight: 1.2,
  };

  const handleStyle: React.CSSProperties = {
    fontFamily: "var(--font-inter), sans-serif",
    fontWeight: 400,
    fontSize: "13px",
    color: "rgba(255,255,255,0.45)",
    lineHeight: 1.2,
  };

  const dotStyle: React.CSSProperties = {
    fontSize: "13px",
    color: "rgba(255,255,255,0.3)",
  };

  const timeStyle: React.CSSProperties = {
    fontFamily: "var(--font-inter), sans-serif",
    fontWeight: 400,
    fontSize: "13px",
    color: "rgba(255,255,255,0.45)",
    lineHeight: 1.2,
  };

  const contentStyle: React.CSSProperties = {
    fontFamily: "var(--font-inter), sans-serif",
    fontSize: "15px",
    lineHeight: 1.45,
    color: "rgba(255,255,255,0.85)",
    marginBottom: "8px",
    wordBreak: "break-word",
    whiteSpace: "pre-wrap",
  };

  const tagsRowStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginBottom: "10px",
  };

  const tagPillStyle: React.CSSProperties = {
    fontFamily: "var(--font-inter), sans-serif",
    fontSize: "11px",
    fontWeight: 600,
    color: "#FF6B35",
    backgroundColor: "rgba(255,107,53,0.12)",
    padding: "2px 8px",
    borderRadius: "10px",
    lineHeight: 1.5,
    textTransform: "uppercase",
    letterSpacing: "0.3px",
  };

  const actionBarStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    marginTop: "4px",
  };

  const actionBtnStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    padding: "4px 10px",
    borderRadius: "8px",
    border: "none",
    background: "none",
    cursor: "pointer",
    transition: "background-color 0.15s ease",
    fontFamily: "var(--font-inter), sans-serif",
    fontSize: "13px",
    fontWeight: 500,
  };

  const actionCountStyle = (color?: string): React.CSSProperties => ({
    color: color || "rgba(255,255,255,0.45)",
    fontSize: "13px",
    fontFamily: "var(--font-mono), monospace",
    fontWeight: 500,
    minWidth: "16px",
  });

  return (
    <Link
      href={`/court/take/${take.id}`}
      style={cardStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Header row: avatar + name/handle/time + menu */}
      <div style={{ ...headerRowStyle, justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
          <span
            role="link"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/user/${take.author.name}`); }}
            style={{ ...avatarStyle, textDecoration: "none", color: "inherit", cursor: "pointer" }}
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt={take.author.displayName || take.author.name} style={avatarImgStyle} />
            ) : (
              getInitial(take.author.displayName || take.author.name)
            )}
          </span>
          <div style={metaStyle}>
            <span
              role="link"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/user/${take.author.name}`); }}
              style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}
            >
              <span style={displayNameStyle}>{take.author.displayName || take.author.name}</span>
            </span>
            {take.author.streakType === "HOT" && take.author.streakCount && take.author.streakCount > 0 && (
              <span title={`${take.author.streakCount} hot streak`} style={{ display: "inline-flex", alignItems: "center", gap: "2px", fontSize: "12px", color: "#FF6B35", fontWeight: 700, fontFamily: "var(--font-mono), monospace" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#FF6B35" stroke="#FF6B35" strokeWidth="1"><path d="M12 12c2-2.96 0-7-1-8 0 3.04-4 6.5-4 8s2.05 4 5 4 5-2 5-4c0-2-2-3-3-3-1 2-2 3-2 3z" /></svg>
                {take.author.streakCount}
              </span>
            )}
            {take.author.streakType === "COLD" && take.author.streakCount && take.author.streakCount > 0 && (
              <span title={`${take.author.streakCount} cold streak`} style={{ display: "inline-flex", alignItems: "center", gap: "2px", fontSize: "12px", color: "#3B82F6", fontWeight: 700, fontFamily: "var(--font-mono), monospace" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" /></svg>
                {take.author.streakCount}
              </span>
            )}
            <span style={handleStyle}>@{take.author.name}</span>
            <span style={dotStyle}>&#183;</span>
            <span style={timeStyle}>{getTimeAgo(take.createdAt)}</span>
            {/* Stat Check Status */}
            {take.statCheck && take.statCheck.overallStatus !== "PENDING" && (
              <>
                <span style={dotStyle}>&#183;</span>
                <span
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowStatCheckDetails((v) => !v); }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "3px",
                    fontSize: "11px",
                    fontWeight: 700,
                    fontFamily: "var(--font-inter), sans-serif",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: take.statCheck.overallStatus === "VERIFIED" ? "#22C55E" : take.statCheck.overallStatus === "FALSE" ? "#EF4444" : "#9CA3AF",
                    cursor: "pointer",
                  }}
                  title="Click to see details"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                  {take.statCheck.overallStatus === "VERIFIED" ? "Verified" : take.statCheck.overallStatus === "FALSE" ? "False" : "Unverifiable"}
                </span>
              </>
            )}
            {/* Prediction Status */}
            {take.prediction && (
              <>
                <span style={dotStyle}>&#183;</span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "3px",
                    fontSize: "11px",
                    fontWeight: 700,
                    fontFamily: "var(--font-inter), sans-serif",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: take.prediction.status === "RECEIPT" ? "#22C55E" : take.prediction.status === "BUST" ? "#EF4444" : "#FBBf24",
                  }}
                  title={take.prediction.claim}
                >
                  {take.prediction.status === "RECEIPT" ? (
                    <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>Receipt</>
                  ) : take.prediction.status === "BUST" ? (
                    <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>Bust</>
                  ) : (
                    <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>Prediction</>
                  )}
                </span>
              </>
            )}
            {/* Aging Status */}
            {take.agingTake && (
              <>
                <span style={dotStyle}>&#183;</span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "3px",
                    fontSize: "11px",
                    fontWeight: 700,
                    fontFamily: "var(--font-inter), sans-serif",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: take.agingTake.status === "AGED" ? "#A855F7" : "#FBBf24",
                  }}
                  title={take.agingTake.status === "AGED" ? `Resurfaced from ${new Date(take.agingTake.revisitDate).toLocaleDateString()}` : `Revisit on ${new Date(take.agingTake.revisitDate).toLocaleDateString()}`}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  {take.agingTake.status === "AGED" ? "Aged" : (() => {
                    const days = Math.max(0, Math.ceil((new Date(take.agingTake!.revisitDate).getTime() - Date.now()) / 86400000));
                    return days > 0 ? `${days}d` : "Due";
                  })()}
                </span>
              </>
            )}
            {/* Courtside Clock */}
            {take.gameClock && (
              <>
                <span style={dotStyle}>&#183;</span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "3px",
                    fontSize: "11px",
                    fontWeight: 700,
                    fontFamily: "var(--font-mono), monospace",
                    color: "#3B82F6",
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  {take.quarter && `Q${take.quarter} `}{take.gameClock}
                </span>
              </>
            )}
          </div>
        </div>
        {canDelete && (
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={toggleMenu}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px 8px",
                color: "rgba(255,255,255,0.35)",
                fontSize: "18px",
                lineHeight: 1,
                borderRadius: "4px",
                transition: "color 0.15s ease",
              }}
              aria-label="More options"
            >
              &#8943;
            </button>
            {showMenu && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "100%",
                  backgroundColor: "#2a2a2a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  overflow: "hidden",
                  zIndex: 50,
                  minWidth: "120px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                }}
              >
                <button
                  type="button"
                  onClick={handleDelete}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "10px 16px",
                    background: "none",
                    border: "none",
                    color: "#EF4444",
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => { (e.target as HTMLElement).style.backgroundColor = "rgba(239,68,68,0.1)"; }}
                  onMouseLeave={(e) => { (e.target as HTMLElement).style.backgroundColor = "transparent"; }}
                >
                  Delete Take
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={contentStyle}>{take.content}</div>

      {/* Stat Check Claims Detail */}
      {showStatCheckDetails && take.statCheck && Array.isArray(take.statCheck.claims) && take.statCheck.claims.length > 0 && (
        <div
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          style={{
            margin: "8px 0 10px",
            padding: "10px 12px",
            borderRadius: "8px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-inter), sans-serif", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
            Stat Check Analysis
          </div>
          {(take.statCheck.claims as Array<{ claim: string; verdict: string; evidence: string }>).map((c, i) => (
            <div key={i} style={{ marginBottom: i < (take.statCheck!.claims as unknown[]).length - 1 ? "8px" : 0, paddingBottom: i < (take.statCheck!.claims as unknown[]).length - 1 ? "8px" : 0, borderBottom: i < (take.statCheck!.claims as unknown[]).length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                <span style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  fontFamily: "var(--font-inter), sans-serif",
                  textTransform: "uppercase",
                  padding: "1px 6px",
                  borderRadius: "4px",
                  background: c.verdict === "VERIFIED" ? "rgba(34,197,94,0.15)" : c.verdict === "FALSE" ? "rgba(239,68,68,0.15)" : "rgba(156,163,175,0.15)",
                  color: c.verdict === "VERIFIED" ? "#22C55E" : c.verdict === "FALSE" ? "#EF4444" : "#9CA3AF",
                }}>
                  {c.verdict}
                </span>
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)", fontFamily: "var(--font-inter), sans-serif", fontWeight: 600 }}>
                  {c.claim}
                </span>
              </div>
              {c.evidence && (
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-inter), sans-serif", paddingLeft: "2px" }}>
                  {c.evidence}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tags */}
      {take.tags && take.tags.length > 0 && (
        <div style={tagsRowStyle}>
          {take.tags.map((tag) => (
            <span key={tag} style={tagPillStyle}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Poll */}
      {take.poll && take.poll.options.length > 0 && (() => {
        const userVotedOptionId = take.poll.votes?.[0]?.optionId || null;
        const hasVoted = !!userVotedOptionId;
        const pollEnded = take.poll.endsAt ? new Date() > new Date(take.poll.endsAt) : false;
        const showResults = hasVoted || pollEnded;
        const totalVotes = take.poll.totalVotes || 0;

        return (
          <div
            style={{
              marginBottom: "10px",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "10px",
              overflow: "hidden",
            }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            {take.poll.options.map((option) => {
              const pct = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;
              const isUserVote = userVotedOptionId === option.id;

              if (showResults) {
                return (
                  <div
                    key={option.id}
                    style={{
                      position: "relative",
                      padding: "10px 14px",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    {/* Percentage bar background */}
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        bottom: 0,
                        width: `${pct}%`,
                        backgroundColor: isUserVote ? "rgba(255,107,53,0.2)" : "rgba(255,255,255,0.06)",
                        transition: "width 0.4s ease",
                      }}
                    />
                    <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{
                        fontFamily: "var(--font-inter), sans-serif",
                        fontSize: "13px",
                        fontWeight: isUserVote ? 700 : 500,
                        color: isUserVote ? "#FF6B35" : "rgba(255,255,255,0.7)",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}>
                        {isUserVote && <span style={{ fontSize: "11px" }}>&#10003;</span>}
                        {option.text}
                      </span>
                      <span style={{
                        fontFamily: "var(--font-mono), monospace",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: isUserVote ? "#FF6B35" : "rgba(255,255,255,0.5)",
                      }}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              }

              // Not voted yet - show clickable options
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={(e) => handlePollVote(e, option.id)}
                  disabled={!!votingOptionId}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "10px 14px",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    background: "none",
                    border: "none",
                    borderBottomStyle: "solid",
                    borderBottomWidth: "1px",
                    borderBottomColor: "rgba(255,255,255,0.06)",
                    cursor: votingOptionId ? "not-allowed" : "pointer",
                    textAlign: "left",
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.8)",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => { if (!votingOptionId) (e.target as HTMLElement).style.backgroundColor = "rgba(255,107,53,0.1)"; }}
                  onMouseLeave={(e) => { (e.target as HTMLElement).style.backgroundColor = "transparent"; }}
                >
                  {votingOptionId === option.id ? "Voting..." : option.text}
                </button>
              );
            })}
            {/* Poll footer: total votes + time left */}
            <div style={{
              padding: "8px 14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <span style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: "12px",
                color: "rgba(255,255,255,0.35)",
              }}>
                {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
              </span>
              <span style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: "12px",
                color: pollEnded ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.35)",
              }}>
                {pollEnded
                  ? "Poll ended"
                  : take.poll.endsAt
                    ? (() => {
                        const hoursLeft = Math.max(0, Math.ceil((new Date(take.poll!.endsAt!).getTime() - Date.now()) / 3600000));
                        return hoursLeft > 24 ? `${Math.floor(hoursLeft / 24)}d left` : `${hoursLeft}h left`;
                      })()
                    : "Open poll"}
              </span>
            </div>
          </div>
        );
      })()}

      {/* Action bar */}
      <div style={actionBarStyle}>
        {/* Fire */}
        <button
          type="button"
          style={{ ...actionBtnStyle, color: take.userReaction === "FIRE" ? "#FF6B35" : "rgba(255,255,255,0.45)" }}
          onClick={(e) => handleReact(e, "FIRE")}
          aria-label="Fire"
        >
          <FireIcon active={take.userReaction === "FIRE"} />
          <span style={actionCountStyle(take.userReaction === "FIRE" ? "#FF6B35" : undefined)}>
            {take.fireCount > 0 ? take.fireCount : ""} Fire
          </span>
        </button>

        {/* Brick */}
        <button
          type="button"
          style={{ ...actionBtnStyle, color: take.userReaction === "BRICK" ? "#FF6B35" : "rgba(255,255,255,0.45)" }}
          onClick={(e) => handleReact(e, "BRICK")}
          aria-label="Brick"
        >
          <BrickIcon active={take.userReaction === "BRICK"} />
          <span style={actionCountStyle(take.userReaction === "BRICK" ? "#FF6B35" : undefined)}>
            {take.brickCount > 0 ? take.brickCount : ""} Brick
          </span>
        </button>

        {/* Reply */}
        <button type="button" style={actionBtnStyle} aria-label="Reply" onClick={handleReply}>
          <ReplyIcon />
          <span style={actionCountStyle()}>
            {take.replyCount > 0 ? take.replyCount : ""} Reply
          </span>
        </button>

        {/* Repost */}
        <button
          type="button"
          style={{ ...actionBtnStyle, color: take.userReposted ? "#22C55E" : "rgba(255,255,255,0.45)" }}
          onClick={handleRepost}
          aria-label="Repost"
        >
          <RepostIcon active={take.userReposted} />
          <span style={actionCountStyle(take.userReposted ? "#22C55E" : undefined)}>
            {take.repostCount > 0 ? take.repostCount : ""} Repost
          </span>
        </button>

        {/* Stat Check */}
        {onStatCheck && !take.statCheck && (
          <button
            type="button"
            style={{ ...actionBtnStyle, color: statCheckLoading === take.id ? "#FF6B35" : "rgba(255,255,255,0.45)" }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (statCheckLoading !== take.id) onStatCheck(take.id); }}
            aria-label="Stat Check"
            title={statCheckLoading === take.id ? "Checking..." : "Fact-check this take"}
            disabled={statCheckLoading === take.id}
          >
            {statCheckLoading === take.id ? (
              <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid rgba(255,107,53,0.3)", borderTopColor: "#FF6B35", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
            )}
          </button>
        )}

        {/* Challenge */}
        {onChallenge && currentUserId && currentUserId !== take.author.id && (
          <button
            type="button"
            style={{ ...actionBtnStyle, color: "rgba(255,255,255,0.45)" }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChallenge(take.id, take.author.id); }}
            aria-label="Challenge"
            title="Challenge this user"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>
          </button>
        )}

        {/* Age */}
        {onAge && !take.agingTake && (
          <button
            type="button"
            style={{ ...actionBtnStyle, color: "rgba(255,255,255,0.45)" }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAge(take.id); }}
            aria-label="Age this take"
            title="Mark for revisit later"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
          </button>
        )}

        {/* Views */}
        {(take.viewCount ?? 0) > 0 && (
          <span
            style={{
              ...actionBtnStyle,
              cursor: "default",
              color: "rgba(255,255,255,0.35)",
              marginLeft: "auto",
            }}
            aria-label="Views"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span style={actionCountStyle()}>
              {take.viewCount! >= 1000
                ? `${(take.viewCount! / 1000).toFixed(take.viewCount! >= 10000 ? 0 : 1)}K`
                : take.viewCount}
            </span>
          </span>
        )}

        {/* Bookmark */}
        <button
          type="button"
          style={{ ...actionBtnStyle, marginLeft: (take.viewCount ?? 0) > 0 ? undefined : "auto", color: take.userBookmarked ? "#FF6B35" : "rgba(255,255,255,0.45)" }}
          onClick={handleBookmark}
          aria-label="Save"
        >
          <BookmarkIcon active={take.userBookmarked} />
          <span style={actionCountStyle(take.userBookmarked ? "#FF6B35" : undefined)}>Save</span>
        </button>
      </div>
    </Link>
  );
}
