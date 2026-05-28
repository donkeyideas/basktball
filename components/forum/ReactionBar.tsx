"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

interface Reaction {
  id: string;
  userId: string;
  type: string;
}

interface ReactionBarProps {
  postId: string;
  likeCount: number;
  dislikeCount: number;
  reactions: Reaction[];
}

const REACTION_ICONS: Record<string, { emoji: string; label: string }> = {
  LIKE: { emoji: "LIKE", label: "Like" },
  DISLIKE: { emoji: "DISLIKE", label: "Dislike" },
  FIRE: { emoji: "FIRE", label: "Fire" },
  BRICK: { emoji: "BRICK", label: "Brick" },
};

export default function ReactionBar({ postId, likeCount: initialLikes, dislikeCount: initialDislikes, reactions: initialReactions }: ReactionBarProps) {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id;
  const [reactions, setReactions] = useState(initialReactions);
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [loading, setLoading] = useState(false);

  const userReactions = new Set(reactions.filter((r) => r.userId === userId).map((r) => r.type));

  async function handleReaction(type: string) {
    if (!userId || loading) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/forum/posts/${postId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.action === "added") {
          setReactions((prev) => [...prev, { id: "temp", userId, type }]);
          if (type === "LIKE" || type === "FIRE") setLikes((p) => p + 1);
          if (type === "DISLIKE" || type === "BRICK") setDislikes((p) => p + 1);
        } else {
          setReactions((prev) => prev.filter((r) => !(r.userId === userId && r.type === type)));
          if (type === "LIKE" || type === "FIRE") setLikes((p) => Math.max(0, p - 1));
          if (type === "DISLIKE" || type === "BRICK") setDislikes((p) => Math.max(0, p - 1));
        }
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
      {Object.entries(REACTION_ICONS).map(([type, { emoji, label }]) => {
        const isActive = userReactions.has(type);
        const count = type === "LIKE" || type === "FIRE" ? likes : dislikes;
        return (
          <button
            key={type}
            onClick={() => handleReaction(type)}
            disabled={!userId || loading}
            title={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 8px",
              borderRadius: "6px",
              border: `1px solid ${isActive ? "#FF6B35" : "var(--border-color)"}`,
              background: isActive ? "rgba(255,107,53,0.15)" : "transparent",
              color: isActive ? "#FF6B35" : "var(--text-muted)",
              cursor: userId ? "pointer" : "default",
              fontSize: "13px",
              opacity: !userId ? 0.4 : 1,
            }}
          >
            <span>{emoji}</span>
            {(type === "LIKE" || type === "FIRE") && count > 0 && <span>{count}</span>}
            {(type === "DISLIKE" || type === "BRICK") && count > 0 && <span>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
