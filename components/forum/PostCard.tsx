"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import UserBadge from "./UserBadge";
import ReactionBar from "./ReactionBar";

interface PostCardProps {
  post: {
    id: string;
    content: string;
    postNumber: number;
    isEdited: boolean;
    editedAt?: string | null;
    likeCount: number;
    dislikeCount: number;
    createdAt: string;
    author: {
      id: string;
      displayName?: string | null;
      name?: string | null;
      avatarUrl?: string | null;
      image?: string | null;
      role: string;
      reputation?: number;
      postCount?: number;
      favoriteTeamId?: string | null;
      createdAt?: string;
    };
    reactions: { id: string; userId: string; type: string }[];
  };
  onReply?: (postId: string) => void;
}

export default function PostCard({ post, onReply }: PostCardProps) {
  const { data: session } = useSession();
  const [factCheck, setFactCheck] = useState<string | null>(null);
  const [factCheckLoading, setFactCheckLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("SPAM");
  const [reportLoading, setReportLoading] = useState(false);

  const timeAgo = getTimeAgo(new Date(post.createdAt));

  async function handleFactCheck() {
    if (factCheckLoading) return;
    setFactCheckLoading(true);
    try {
      const res = await fetch(`/api/forum/posts/${post.id}/fact-check`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setFactCheck(data.factCheck);
      }
    } catch {
      setFactCheck("Failed to fact-check this post.");
    } finally {
      setFactCheckLoading(false);
    }
  }

  async function handleReport() {
    setReportLoading(true);
    try {
      const res = await fetch("/api/forum/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, reason: reportReason }),
      });
      if (res.ok) {
        setShowReport(false);
        alert("Report submitted. Thank you.");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to submit report");
      }
    } catch {
      alert("Failed to submit report");
    } finally {
      setReportLoading(false);
    }
  }

  return (
    <div style={{
      background: "var(--dark-gray)",
      borderRadius: "8px",
      border: "1px solid #2a2a2a",
      padding: "20px",
      marginBottom: "12px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <UserBadge user={post.author} />
        <div style={{ fontSize: "12px", color: "var(--text-faint)", textAlign: "right" }}>
          <span>#{post.postNumber}</span> &middot; <span>{timeAgo}</span>
          {post.isEdited && <span> &middot; edited</span>}
        </div>
      </div>

      {/* Content */}
      <div style={{
        color: "var(--text-secondary)",
        fontSize: "14px",
        lineHeight: "1.7",
        marginBottom: "16px",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}>
        {post.content}
      </div>

      {/* Fact check result */}
      {factCheck && (
        <div style={{
          background: "rgba(59,130,246,0.1)",
          border: "1px solid rgba(59,130,246,0.2)",
          borderRadius: "6px",
          padding: "12px",
          marginBottom: "12px",
          fontSize: "13px",
          color: "var(--text-secondary)",
        }}>
          <div style={{ fontWeight: "700", color: "#3B82F6", marginBottom: "6px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px" }}>
            AI Fact Check
          </div>
          {factCheck}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <ReactionBar
          postId={post.id}
          likeCount={post.likeCount}
          dislikeCount={post.dislikeCount}
          reactions={post.reactions}
        />
        <div style={{ display: "flex", gap: "8px" }}>
          {session?.user && onReply && (
            <button
              onClick={() => onReply(post.id)}
              style={{ fontSize: "12px", color: "var(--text-faint)", background: "none", border: "none", cursor: "pointer", padding: "4px 8px" }}
            >
              Reply
            </button>
          )}
          {session?.user && (
            <button
              onClick={handleFactCheck}
              disabled={factCheckLoading}
              style={{ fontSize: "12px", color: "var(--text-faint)", background: "none", border: "none", cursor: "pointer", padding: "4px 8px" }}
            >
              {factCheckLoading ? "Checking..." : "Fact Check"}
            </button>
          )}
          {session?.user && (
            <button
              onClick={() => setShowReport(!showReport)}
              style={{ fontSize: "12px", color: "var(--text-faint)", background: "none", border: "none", cursor: "pointer", padding: "4px 8px" }}
            >
              Report
            </button>
          )}
        </div>
      </div>

      {/* Report form */}
      {showReport && (
        <div style={{ marginTop: "12px", padding: "12px", background: "#111", borderRadius: "6px", display: "flex", gap: "8px", alignItems: "center" }}>
          <select
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            style={{ padding: "6px", borderRadius: "4px", background: "#222", color: "var(--white)", border: "1px solid #333", fontSize: "13px" }}
          >
            <option value="SPAM">Spam</option>
            <option value="HARASSMENT">Harassment</option>
            <option value="OFFENSIVE">Offensive</option>
            <option value="OFF_TOPIC">Off Topic</option>
            <option value="MISINFORMATION">Misinformation</option>
            <option value="OTHER">Other</option>
          </select>
          <button
            onClick={handleReport}
            disabled={reportLoading}
            style={{ padding: "6px 12px", borderRadius: "4px", background: "#EF4444", color: "var(--white)", border: "none", cursor: "pointer", fontSize: "13px" }}
          >
            Submit
          </button>
          <button
            onClick={() => setShowReport(false)}
            style={{ padding: "6px 12px", borderRadius: "4px", background: "var(--border-color)", color: "var(--white)", border: "none", cursor: "pointer", fontSize: "13px" }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}
