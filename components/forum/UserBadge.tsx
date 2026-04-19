"use client";

interface UserBadgeProps {
  user: {
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
  size?: "sm" | "md";
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "#EF4444",
  MODERATOR: "#8B5CF6",
  EDITOR: "#3B82F6",
  PREMIUM: "#F59E0B",
};

export default function UserBadge({ user, size = "md" }: UserBadgeProps) {
  const displayName = user.displayName || user.name || "Anonymous";
  const avatar = user.avatarUrl || user.image;
  const avatarSize = size === "sm" ? 28 : 40;
  const roleBadge = ROLE_COLORS[user.role];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: size === "sm" ? "8px" : "12px" }}>
      <div style={{
        width: avatarSize,
        height: avatarSize,
        borderRadius: "50%",
        background: avatar ? "transparent" : "#FF6B35",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size === "sm" ? "12px" : "16px",
        fontWeight: "700",
        color: "var(--white)",
        overflow: "hidden",
        flexShrink: 0,
      }}>
        {avatar ? (
          <img src={avatar} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          displayName.charAt(0).toUpperCase()
        )}
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{
            fontWeight: "600",
            fontSize: size === "sm" ? "13px" : "14px",
            color: "var(--white)",
          }}>
            {displayName}
          </span>
          {roleBadge && (
            <span style={{
              fontSize: "10px",
              fontWeight: "700",
              padding: "1px 6px",
              borderRadius: "4px",
              background: `${roleBadge}22`,
              color: roleBadge,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}>
              {user.role === "ADMIN" ? "ADMIN" : user.role === "MODERATOR" ? "MOD" : user.role}
            </span>
          )}
        </div>
        {size === "md" && user.reputation !== undefined && (
          <div style={{ fontSize: "11px", color: "var(--text-faint)", marginTop: "2px" }}>
            {user.reputation} rep &middot; {user.postCount || 0} posts
          </div>
        )}
      </div>
    </div>
  );
}
