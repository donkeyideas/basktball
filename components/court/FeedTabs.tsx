"use client";

import React, { useState, useCallback } from "react";

// --- Types ---

export type FeedTab = "FOR YOU" | "FOLLOWING" | "LIVE";

interface FeedTabsProps {
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
  hasLiveGames?: boolean;
}

const TABS: FeedTab[] = ["FOR YOU", "FOLLOWING", "LIVE"];

// --- Component ---

export default function FeedTabs({ activeTab, onTabChange, hasLiveGames = false }: FeedTabsProps) {
  const [hoveredTab, setHoveredTab] = useState<FeedTab | null>(null);

  const handleTabClick = useCallback(
    (tab: FeedTab) => {
      onTabChange(tab);
    },
    [onTabChange]
  );

  // --- Styles ---

  const containerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "stretch",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    backgroundColor: "transparent",
    width: "100%",
    overflow: "hidden",
  };

  const getTabStyle = (tab: FeedTab): React.CSSProperties => {
    const isActive = activeTab === tab;
    const isHovered = hoveredTab === tab;

    return {
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
      padding: "12px 0",
      fontFamily: "var(--font-barlow), sans-serif",
      fontSize: "13px",
      fontWeight: 700,
      letterSpacing: "1.2px",
      textTransform: "uppercase",
      color: isActive ? "#FFFFFF" : isHovered ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.4)",
      backgroundColor: "transparent",
      border: "none",
      borderBottom: isActive ? "2px solid #FF6B35" : "2px solid transparent",
      cursor: "pointer",
      transition: "color 0.15s ease, border-color 0.15s ease",
      position: "relative",
    };
  };

  const liveDotStyle: React.CSSProperties = {
    width: 6,
    height: 6,
    borderRadius: "50%",
    backgroundColor: "#EF4444",
    flexShrink: 0,
    animation: "courtLivePulse 2s ease-in-out infinite",
  };

  return (
    <>
      {/* Keyframes for live pulse animation */}
      <style>{`
        @keyframes courtLivePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>

      <div style={containerStyle}>
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            style={getTabStyle(tab)}
            onClick={() => handleTabClick(tab)}
            onMouseEnter={() => setHoveredTab(tab)}
            onMouseLeave={() => setHoveredTab(null)}
          >
            {tab}
            {tab === "LIVE" && hasLiveGames && <span style={liveDotStyle} />}
          </button>
        ))}
      </div>
    </>
  );
}
