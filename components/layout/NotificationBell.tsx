"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  data: Record<string, string> | null;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function getNotifIcon(type: string): string {
  const icons: Record<string, string> = {
    FIRE: "\uD83D\uDD25",
    BRICK: "\uD83E\uDDF1",
    REPLY: "\uD83D\uDCAC",
    REPOST: "\uD83D\uDD01",
    FOLLOW: "\uD83D\uDC64",
    CHALLENGE: "\uD83C\uDFF3\uFE0F",
    CHALLENGE_ACCEPT: "\u2694\uFE0F",
    CHALLENGE_VOTE: "\uD83D\uDDF3\uFE0F",
    CHALLENGE_RESULT: "\uD83C\uDFC6",
    PREDICTION_RESOLVED: "\uD83C\uDFB0",
    AGING_RESURFACED: "\u23F0",
    STAT_CHECK: "\uD83D\uDD0D",
    MENTION: "@",
    POLL_ENDED: "\uD83D\uDCCA",
  };
  return icons[type] || "\uD83D\uDD14";
}

function getNotifLink(notif: Notification): string | null {
  if (notif.data?.takeId) return `/court/take/${notif.data.takeId}`;
  if (notif.data?.challengeId) return `/court`;
  if (notif.data?.followerId) return `/user/${notif.data.followerId}`;
  return null;
}

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Poll unread count
  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch("/api/notifications/unread-count");
        const data = await res.json();
        setUnreadCount(data.count || 0);
      } catch { /* ignore */ }
    }
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/notifications?limit=10")
      .then((res) => res.json())
      .then((data) => setNotifications(data.notifications || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  const handleMarkAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotifClick = async (notif: Notification) => {
    if (!notif.read) {
      fetch(`/api/notifications/${notif.id}/read`, { method: "POST" }).catch(() => {});
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, read: true } : n));
    }
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "6px",
          position: "relative",
          color: "#fff",
        }}
        title="Notifications"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: "absolute",
            top: 0,
            right: 0,
            background: "#EF4444",
            color: "#fff",
            fontSize: "10px",
            fontWeight: "700",
            borderRadius: "10px",
            padding: "1px 5px",
            minWidth: "16px",
            textAlign: "center",
            lineHeight: "14px",
            fontFamily: "var(--font-inter)",
          }}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute",
          top: "100%",
          right: 0,
          marginTop: "8px",
          background: "#1A1A1A",
          border: "1px solid #333",
          borderRadius: "12px",
          width: "340px",
          maxHeight: "420px",
          overflowY: "auto",
          zIndex: 200,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            borderBottom: "1px solid #2a2a2a",
          }}>
            <span style={{
              fontFamily: "var(--font-anton)",
              fontSize: "14px",
              color: "#FF6B35",
              letterSpacing: "1px",
            }}>
              NOTIFICATIONS
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: "none",
                  border: "none",
                  color: "#FF6B35",
                  fontSize: "12px",
                  cursor: "pointer",
                  fontFamily: "var(--font-inter)",
                  fontWeight: 600,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ padding: "24px", textAlign: "center", color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-inter)" }}>
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-inter)" }}>
              No notifications yet
            </div>
          ) : (
            notifications.map((notif) => {
              const link = getNotifLink(notif);
              const content = (
                <div
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    padding: "10px 16px",
                    cursor: "pointer",
                    background: notif.read ? "transparent" : "rgba(255,107,53,0.05)",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = notif.read ? "transparent" : "rgba(255,107,53,0.05)"; }}
                >
                  <span style={{ fontSize: "18px", flexShrink: 0, marginTop: "2px" }}>
                    {getNotifIcon(notif.type)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: "var(--font-inter)",
                      fontSize: "13px",
                      color: notif.read ? "rgba(255,255,255,0.5)" : "#fff",
                      fontWeight: notif.read ? 400 : 600,
                      lineHeight: "18px",
                    }}>
                      {notif.title}
                    </div>
                    {notif.body && (
                      <div style={{
                        fontFamily: "var(--font-inter)",
                        fontSize: "12px",
                        color: "rgba(255,255,255,0.3)",
                        marginTop: "2px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {notif.body}
                      </div>
                    )}
                    <div style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.25)",
                      marginTop: "2px",
                    }}>
                      {timeAgo(notif.createdAt)}
                    </div>
                  </div>
                  {!notif.read && (
                    <div style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#FF6B35",
                      flexShrink: 0,
                      marginTop: "6px",
                    }} />
                  )}
                </div>
              );

              return link ? (
                <Link key={notif.id} href={link} style={{ textDecoration: "none" }}>
                  {content}
                </Link>
              ) : (
                <div key={notif.id}>{content}</div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
