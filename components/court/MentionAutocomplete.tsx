"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

interface AutocompleteUser {
  id: string;
  handle: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  image: string | null;
}

interface MentionAutocompleteProps {
  query: string; // The text after '@'
  onSelect: (handle: string) => void;
  onClose: () => void;
  visible: boolean;
}

export default function MentionAutocomplete({ query, onSelect, onClose, visible }: MentionAutocompleteProps) {
  const [users, setUsers] = useState<AutocompleteUser[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch users on query change
  useEffect(() => {
    if (!visible || !query) {
      setUsers([]);
      return;
    }

    setLoading(true);
    const controller = new AbortController();

    fetch(`/api/users/autocomplete?q=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setSelectedIndex(0);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    return () => controller.abort();
  }, [query, visible]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!visible || users.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % users.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + users.length) % users.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const user = users[selectedIndex];
        if (user?.handle) onSelect(user.handle);
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [visible, users, selectedIndex, onSelect, onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!visible || (users.length === 0 && !loading)) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        bottom: "100%",
        left: 16,
        right: 16,
        marginBottom: "4px",
        backgroundColor: "#1A1A1A",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: "10px",
        maxHeight: "200px",
        overflowY: "auto",
        zIndex: 100,
        boxShadow: "0 -4px 16px rgba(0,0,0,0.5)",
      }}
    >
      {loading && users.length === 0 && (
        <div style={{ padding: "10px 14px", fontSize: "13px", color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-inter), sans-serif" }}>
          Searching...
        </div>
      )}
      {users.map((user, i) => (
        <div
          key={user.id}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (user.handle) onSelect(user.handle);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 14px",
            cursor: "pointer",
            backgroundColor: i === selectedIndex ? "rgba(255,107,53,0.12)" : "transparent",
            borderBottom: i < users.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              backgroundColor: "#FF6B35",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              flexShrink: 0,
              fontSize: "12px",
              fontWeight: 700,
              color: "#fff",
              fontFamily: "var(--font-anton), sans-serif",
            }}
          >
            {user.avatarUrl || user.image ? (
              <img src={user.avatarUrl || user.image || ""} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              (user.displayName || "?").charAt(0).toUpperCase()
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.9)", fontFamily: "var(--font-inter), sans-serif" }}>
              {user.displayName || user.handle}
            </div>
            {user.handle && (
              <div style={{ fontSize: "11px", color: "#FF6B35", fontFamily: "var(--font-inter), sans-serif" }}>
                @{user.handle}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
