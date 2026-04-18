"use client";

import React from "react";
import { useRouter } from "next/navigation";

// Combined regex that matches URLs or @mentions
const TOKEN_REGEX = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)|(@[a-zA-Z0-9_]+)/gi;

interface LinkifiedTextProps {
  text: string;
  style?: React.CSSProperties;
}

export default function LinkifiedText({ text, style }: LinkifiedTextProps) {
  const router = useRouter();
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const regex = new RegExp(TOKEN_REGEX.source, "gi");

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];

    if (token.startsWith("http")) {
      // URL — use <span> to avoid nested <a> inside TakeCard's <Link>
      let displayUrl = token;
      try {
        const u = new URL(token);
        displayUrl = u.hostname + (u.pathname !== "/" ? u.pathname : "");
        if (displayUrl.length > 40) displayUrl = displayUrl.slice(0, 37) + "...";
      } catch {
        // keep full URL as display
      }
      const href = token;
      parts.push(
        <span
          key={match.index}
          role="link"
          tabIndex={0}
          style={{
            color: "#FF6B35",
            textDecoration: "none",
            fontWeight: 500,
            cursor: "pointer",
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            window.open(href, "_blank", "noopener,noreferrer");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              window.open(href, "_blank", "noopener,noreferrer");
            }
          }}
        >
          {displayUrl}
        </span>
      );
    } else if (token.startsWith("@")) {
      // @mention — use <span> to avoid nested <a> inside TakeCard's <Link>
      const handle = token.slice(1);
      parts.push(
        <span
          key={match.index}
          role="link"
          tabIndex={0}
          style={{
            color: "#FF6B35",
            textDecoration: "none",
            fontWeight: 600,
            cursor: "pointer",
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            router.push(`/user/${handle}`);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              router.push(`/user/${handle}`);
            }
          }}
        >
          {token}
        </span>
      );
    }

    lastIndex = match.index + token.length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <div style={style}>{parts}</div>;
}
