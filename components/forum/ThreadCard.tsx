import Link from "next/link";
import UserBadge from "./UserBadge";

interface ThreadCardProps {
  thread: {
    id: string;
    title: string;
    slug: string;
    status: string;
    isPinned: boolean;
    isHot: boolean;
    tags: string[];
    postCount: number;
    viewCount: number;
    lastPostAt?: string | null;
    createdAt: string;
    author: {
      id: string;
      displayName?: string | null;
      name?: string | null;
      avatarUrl?: string | null;
      image?: string | null;
      role: string;
      favoriteTeamId?: string | null;
    };
    category?: {
      name: string;
      slug: string;
      color?: string | null;
    };
  };
  showCategory?: boolean;
}

export default function ThreadCard({ thread, showCategory }: ThreadCardProps) {
  const timeAgo = getTimeAgo(new Date(thread.createdAt));

  return (
    <Link
      href={`/forum/thread/${thread.slug}`}
      style={{
        display: "block",
        padding: "16px 20px",
        background: thread.isPinned ? "rgba(255,107,53,0.05)" : "var(--dark-gray)",
        borderRadius: "8px",
        border: `1px solid ${thread.isPinned ? "rgba(255,107,53,0.2)" : "#2a2a2a"}`,
        textDecoration: "none",
        marginBottom: "8px",
        transition: "border-color 0.2s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#FF6B35"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = thread.isPinned ? "rgba(255,107,53,0.2)" : "#2a2a2a"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Badges */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "6px", flexWrap: "wrap" }}>
            {thread.isPinned && (
              <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 6px", borderRadius: "3px", background: "rgba(255,107,53,0.2)", color: "#FF6B35" }}>
                PINNED
              </span>
            )}
            {thread.isHot && (
              <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 6px", borderRadius: "3px", background: "rgba(239,68,68,0.2)", color: "#EF4444" }}>
                HOT
              </span>
            )}
            {thread.status === "LOCKED" && (
              <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 6px", borderRadius: "3px", background: "rgba(107,114,128,0.2)", color: "#6B7280" }}>
                LOCKED
              </span>
            )}
            {showCategory && thread.category && (
              <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 6px", borderRadius: "3px", background: `${thread.category.color}22`, color: thread.category.color || "#fff" }}>
                {thread.category.name}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 style={{
            fontSize: "16px",
            fontWeight: "600",
            color: "var(--white)",
            margin: "0 0 8px 0",
            lineHeight: "1.3",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {thread.title}
          </h3>

          {/* Author + time */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <UserBadge user={thread.author} size="sm" />
            <span style={{ fontSize: "12px", color: "var(--text-faint)" }}>
              {timeAgo}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "20px", alignItems: "center", flexShrink: 0 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "16px", fontWeight: "700", color: "#FF6B35" }}>{thread.postCount}</div>
            <div style={{ fontSize: "10px", color: "var(--text-faint)", textTransform: "uppercase" }}>replies</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-muted)" }}>{thread.viewCount}</div>
            <div style={{ fontSize: "10px", color: "var(--text-faint)", textTransform: "uppercase" }}>views</div>
          </div>
        </div>
      </div>
    </Link>
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
