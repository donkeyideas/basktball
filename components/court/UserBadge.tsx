"use client";

import React from "react";

// --- Types ---

export interface BadgeUser {
  id: string;
  name: string;
  displayName: string;
  image?: string | null;
  avatarUrl?: string | null;
  role?: "USER" | "ADMIN" | "MODERATOR" | string;
}

interface UserBadgeProps {
  user: BadgeUser;
}

// --- Helpers ---

function getInitial(name: string): string {
  return (name?.charAt(0) || "?").toUpperCase();
}

function getRoleBadge(role: string | undefined): { label: string; color: string; bg: string } | null {
  if (!role) return null;
  switch (role) {
    case "ADMIN":
      return { label: "ADMIN", color: "#FF6B35", bg: "rgba(255,107,53,0.15)" };
    case "MODERATOR":
      return { label: "MOD", color: "#22C55E", bg: "rgba(34,197,94,0.15)" };
    default:
      return null;
  }
}

// --- Component ---

export default function UserBadge({ user }: UserBadgeProps) {
  const avatarSrc = user.avatarUrl || user.image || null;
  const roleBadge = getRoleBadge(user.role);

  // --- Styles ---

  const containerStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    cursor: "default",
  };

  const avatarStyle: React.CSSProperties = {
    width: 28,
    height: 28,
    borderRadius: "50%",
    backgroundColor: "#FF6B35",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
    fontFamily: "var(--font-anton), sans-serif",
    fontSize: "13px",
    color: "#FFFFFF",
    lineHeight: 1,
  };

  const avatarImgStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: "50%",
  };

  const displayNameStyle: React.CSSProperties = {
    fontFamily: "var(--font-barlow), sans-serif",
    fontWeight: 700,
    fontSize: "13px",
    color: "#FFFFFF",
    lineHeight: 1.2,
    whiteSpace: "nowrap",
  };

  const roleBadgeStyle: React.CSSProperties = roleBadge
    ? {
        fontFamily: "var(--font-barlow), sans-serif",
        fontSize: "9px",
        fontWeight: 700,
        color: roleBadge.color,
        backgroundColor: roleBadge.bg,
        padding: "1px 6px",
        borderRadius: "4px",
        lineHeight: 1.6,
        letterSpacing: "0.8px",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }
    : {};

  return (
    <div style={containerStyle}>
      {/* Avatar */}
      <div style={avatarStyle}>
        {avatarSrc ? (
          <img src={avatarSrc} alt={user.displayName || user.name} style={avatarImgStyle} />
        ) : (
          getInitial(user.displayName || user.name)
        )}
      </div>

      {/* Display name */}
      <span style={displayNameStyle}>{user.displayName || user.name}</span>

      {/* Role badge */}
      {roleBadge && <span style={roleBadgeStyle}>{roleBadge.label}</span>}
    </div>
  );
}
